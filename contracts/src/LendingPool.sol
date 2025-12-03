// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IInterestRateModel.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title LendingPool
 * @notice Multi-asset lending pool with collateralized borrowing
 */
contract LendingPool is ILendingPool, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1e18; // 1.0

    IInterestRateModel public interestRateModel;
    IPriceOracle public priceOracle;

    // Asset => Config
    mapping(address => AssetConfig) public assetConfigs;
    
    // Asset => Total supplied
    mapping(address => uint256) public totalSupplied;
    
    // Asset => Total borrowed
    mapping(address => uint256) public totalBorrowed;
    
    // User => Asset => Position
    mapping(address => mapping(address => UserPosition)) public userPositions;
    
    // User => Assets supplied (for iteration)
    mapping(address => address[]) private userSuppliedAssets;
    
    // User => Assets borrowed (for iteration)
    mapping(address => address[]) private userBorrowedAssets;

    // E-Mode state variables
    // Asset => Category (0 = disabled, 1 = stablecoins, 2 = ETH, 3 = BTC, 4 = other)
    mapping(address => uint8) public assetCategory;
    
    // User => Active E-Mode category (0 = disabled)
    mapping(address => uint8) public userEModeCategory;
    
    // Category => E-Mode configuration
    mapping(uint8 => EModeCategory) public eModeCategories;

    struct EModeCategory {
        uint256 ltv;                    // E-Mode LTV in basis points
        uint256 liquidationThreshold;   // E-Mode liquidation threshold
        uint256 liquidationBonus;       // E-Mode liquidation bonus
        string label;                   // Category name
    }

    constructor(address _interestRateModel, address _priceOracle) Ownable(msg.sender) {
        interestRateModel = IInterestRateModel(_interestRateModel);
        priceOracle = IPriceOracle(_priceOracle);
    }

    /**
     * @notice Initialize an asset for lending
     */
    function initializeAsset(
        address asset,
        bool canBeCollateral,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external onlyOwner {
        require(!assetConfigs[asset].isActive, "Asset already initialized");
        require(maxLTV <= BASIS_POINTS, "Invalid maxLTV");
        require(liquidationThreshold <= BASIS_POINTS, "Invalid liquidation threshold");
        
        assetConfigs[asset] = AssetConfig({
            isActive: true,
            canBeCollateral: canBeCollateral,
            maxLTV: maxLTV,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus
        });
    }

    /**
     * @notice Supply assets to the pool
     */
    function supply(address asset, uint256 amount) external override nonReentrant {
        require(assetConfigs[asset].isActive, "Asset not active");
        require(amount > 0, "Amount must be > 0");

        UserPosition storage position = userPositions[msg.sender][asset];
        
        // Add to user's supplied assets if first time
        if (position.supplied == 0) {
            userSuppliedAssets[msg.sender].push(asset);
        }

        // Update position
        position.supplied += amount;
        position.lastUpdateTimestamp = block.timestamp;
        
        // Update total
        totalSupplied[asset] += amount;

        // Transfer tokens
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        emit Supply(msg.sender, asset, amount);
    }

    /**
     * @notice Withdraw supplied assets
     */
    function withdraw(address asset, uint256 amount) external override nonReentrant {
        require(assetConfigs[asset].isActive, "Asset not active");
        require(amount > 0, "Amount must be > 0");

        UserPosition storage position = userPositions[msg.sender][asset];
        require(position.supplied >= amount, "Insufficient supplied balance");

        // Update position
        position.supplied -= amount;
        position.lastUpdateTimestamp = block.timestamp;
        
        // Update total
        totalSupplied[asset] -= amount;

        // Check health factor if user has borrows
        if (getUserTotalDebtValue(msg.sender) > 0) {
            require(getUserHealthFactor(msg.sender) >= HEALTH_FACTOR_LIQUIDATION_THRESHOLD, "Health factor too low");
        }

        // Transfer tokens
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, asset, amount);
    }

    /**
     * @notice Borrow assets against collateral
     */
    function borrow(address asset, uint256 amount) external override nonReentrant {
        require(assetConfigs[asset].isActive, "Asset not active");
        require(amount > 0, "Amount must be > 0");
        require(getAvailableLiquidity(asset) >= amount, "Insufficient liquidity");

        // E-Mode check: if user has E-Mode enabled, asset must be in same category
        uint8 userCategory = userEModeCategory[msg.sender];
        if (userCategory != 0) {
            require(assetCategory[asset] == userCategory, "Asset not in E-Mode category");
        }

        UserPosition storage position = userPositions[msg.sender][asset];
        
        // Add to user's borrowed assets if first time
        if (position.borrowed == 0) {
            userBorrowedAssets[msg.sender].push(asset);
        }

        // Update position
        position.borrowed += amount;
        position.lastUpdateTimestamp = block.timestamp;
        
        // Update total
        totalBorrowed[asset] += amount;

        // Check health factor
        require(getUserHealthFactor(msg.sender) >= HEALTH_FACTOR_LIQUIDATION_THRESHOLD, "Health factor too low");

        // Transfer tokens
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, asset, amount);
    }

    /**
     * @notice Repay borrowed assets
     */
    function repay(address asset, uint256 amount) external override nonReentrant {
        require(assetConfigs[asset].isActive, "Asset not active");
        require(amount > 0, "Amount must be > 0");

        UserPosition storage position = userPositions[msg.sender][asset];
        require(position.borrowed > 0, "No debt to repay");

        // Cap amount at borrowed amount
        uint256 repayAmount = amount > position.borrowed ? position.borrowed : amount;

        // Update position
        position.borrowed -= repayAmount;
        position.lastUpdateTimestamp = block.timestamp;
        
        // Update total
        totalBorrowed[asset] -= repayAmount;

        // Transfer tokens
        IERC20(asset).safeTransferFrom(msg.sender, address(this), repayAmount);

        emit Repay(msg.sender, asset, repayAmount);
    }

    /**
     * @notice Repay borrowed assets on behalf of another user
     * @dev Allows third parties (e.g., AutoRepayEngine) to repay user debt
     * @param asset Asset to repay
     * @param amount Amount to repay
     * @param onBehalfOf User whose debt to repay
     */
    function repayOnBehalf(address asset, uint256 amount, address onBehalfOf) external nonReentrant {
        require(assetConfigs[asset].isActive, "Asset not active");
        require(amount > 0, "Amount must be > 0");
        require(onBehalfOf != address(0), "Invalid user");

        UserPosition storage position = userPositions[onBehalfOf][asset];
        require(position.borrowed > 0, "No debt to repay");

        // Cap amount at borrowed amount
        uint256 repayAmount = amount > position.borrowed ? position.borrowed : amount;

        // Update position
        position.borrowed -= repayAmount;
        position.lastUpdateTimestamp = block.timestamp;
        
        // Update total
        totalBorrowed[asset] -= repayAmount;

        // Transfer tokens from caller
        IERC20(asset).safeTransferFrom(msg.sender, address(this), repayAmount);

        emit Repay(onBehalfOf, asset, repayAmount);
    }

    /**
     * @notice Get user position for an asset
     */
    function getUserPosition(address user, address asset) external view override returns (UserPosition memory) {
        return userPositions[user][asset];
    }

    /**
     * @notice Seed initial liquidity for an asset (owner only)
     * @dev This provides bootstrap liquidity so users can always borrow
     * @param asset The asset to seed
     * @param amount The amount to seed
     */
    function seedLiquidity(address asset, uint256 amount) external onlyOwner nonReentrant {
        require(assetConfigs[asset].isActive, "Asset not active");
        require(amount > 0, "Amount must be > 0");

        // Update total supplied (no user position for seeded liquidity)
        totalSupplied[asset] += amount;

        // Transfer tokens from owner to pool
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        emit Supply(address(this), asset, amount); // Emit with pool address as supplier
    }

    /**
     * @notice Configure an E-Mode category (owner only)
     * @param categoryId Category ID (1-4)
     * @param ltv E-Mode LTV in basis points
     * @param liquidationThreshold E-Mode liquidation threshold
     * @param liquidationBonus E-Mode liquidation bonus
     * @param label Category name
     */
    function setEModeCategory(
        uint8 categoryId,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        string memory label
    ) external onlyOwner {
        require(categoryId > 0 && categoryId <= 4, "Invalid category ID");
        require(ltv <= BASIS_POINTS, "Invalid LTV");
        require(liquidationThreshold <= BASIS_POINTS, "Invalid liquidation threshold");
        
        eModeCategories[categoryId] = EModeCategory({
            ltv: ltv,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus,
            label: label
        });
        
        emit EModeCategoryConfigured(categoryId, ltv, liquidationThreshold, label);
    }

    /**
     * @notice Set asset category for E-Mode (owner only)
     * @param asset Asset address
     * @param categoryId Category ID (0 = disabled, 1-4 = categories)
     */
    function setAssetCategory(address asset, uint8 categoryId) external onlyOwner {
        require(assetConfigs[asset].isActive, "Asset not active");
        require(categoryId <= 4, "Invalid category ID");
        
        assetCategory[asset] = categoryId;
        emit EModeAssetCategorySet(asset, categoryId);
    }

    /**
     * @notice Enable/disable E-Mode for user
     * @param categoryId Category ID (0 = disable, 1-4 = enable for category)
     */
    function setUserEMode(uint8 categoryId) external {
        require(categoryId <= 4, "Invalid category ID");
        
        if (categoryId != 0) {
            // Enabling E-Mode - verify user has collateral in this category
            require(_userHasCollateralInCategory(msg.sender, categoryId), "No collateral in this category");
        }
        
        userEModeCategory[msg.sender] = categoryId;
        emit UserEModeSet(msg.sender, categoryId);
    }

    /**
     * @notice Check if user has collateral in a specific category
     */
    function _userHasCollateralInCategory(address user, uint8 categoryId) internal view returns (bool) {
        address[] memory suppliedAssets = userSuppliedAssets[user];
        
        for (uint256 i = 0; i < suppliedAssets.length; i++) {
            address asset = suppliedAssets[i];
            if (assetCategory[asset] == categoryId && userPositions[user][asset].supplied > 0) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @notice Get user's E-Mode category
     */
    function getUserEMode(address user) external view returns (uint8) {
        return userEModeCategory[user];
    }

    /**
     * @notice Get asset category
     */
    function getAssetCategory(address asset) external view returns (uint8) {
        return assetCategory[asset];
    }

    /**
     * @notice Get E-Mode category configuration
     */
    function getEModeCategory(uint8 categoryId) external view returns (EModeCategory memory) {
        return eModeCategories[categoryId];
    }

    /**
     * @notice Get total supplied for an asset
     */
    function getTotalSupply(address asset) external view override returns (uint256) {
        return totalSupplied[asset];
    }

    /**
     * @notice Get total borrowed for an asset
     */
    function getTotalBorrowed(address asset) external view override returns (uint256) {
        return totalBorrowed[asset];
    }

    /**
     * @notice Get available liquidity for an asset
     */
    function getAvailableLiquidity(address asset) public view override returns (uint256) {
        return totalSupplied[asset] - totalBorrowed[asset];
    }

    /**
     * @notice Get utilization rate for an asset (in basis points)
     */
    function getUtilizationRate(address asset) public view override returns (uint256) {
        uint256 supplied = totalSupplied[asset];
        if (supplied == 0) return 0;
        return (totalBorrowed[asset] * BASIS_POINTS) / supplied;
    }

    /**
     * @notice Get user's total collateral value in USD
     */
    function getUserTotalCollateralValue(address user) public view override returns (uint256) {
        uint256 totalValue = 0;
        address[] memory suppliedAssets = userSuppliedAssets[user];
        uint8 userCategory = userEModeCategory[user];
        
        for (uint256 i = 0; i < suppliedAssets.length; i++) {
            address asset = suppliedAssets[i];
            AssetConfig memory config = assetConfigs[asset];
            
            if (!config.canBeCollateral) continue;
            
            UserPosition memory position = userPositions[user][asset];
            if (position.supplied == 0) continue;
            
            uint256 price = priceOracle.getPrice(asset);
            uint256 decimals = _getDecimals(asset);
            
            // Determine LTV to use: E-Mode LTV if user is in E-Mode and asset matches category
            uint256 ltv;
            if (userCategory != 0 && assetCategory[asset] == userCategory) {
                ltv = eModeCategories[userCategory].ltv; // Use E-Mode LTV
            } else {
                ltv = config.maxLTV; // Use standard LTV
            }
            
            // Value = amount * price * LTV / (10^decimals * BASIS_POINTS)
            uint256 assetValue = (position.supplied * price * ltv) / (10**decimals * BASIS_POINTS);
            totalValue += assetValue;
        }
        
        return totalValue;
    }

    /**
     * @notice Get user's total debt value in USD
     */
    function getUserTotalDebtValue(address user) public view override returns (uint256) {
        uint256 totalValue = 0;
        address[] memory borrowedAssets = userBorrowedAssets[user];
        
        for (uint256 i = 0; i < borrowedAssets.length; i++) {
            address asset = borrowedAssets[i];
            UserPosition memory position = userPositions[user][asset];
            
            if (position.borrowed == 0) continue;
            
            uint256 price = priceOracle.getPrice(asset);
            uint256 decimals = _getDecimals(asset);
            
            // Value = amount * price / (10^decimals)
            uint256 assetValue = (position.borrowed * price) / (10**decimals);
            totalValue += assetValue;
        }
        
        return totalValue;
    }

    /**
     * @notice Get user's health factor (18 decimals, 1e18 = 1.0)
     */
    function getUserHealthFactor(address user) public view override returns (uint256) {
        uint256 totalDebt = getUserTotalDebtValue(user);
        if (totalDebt == 0) return type(uint256).max; // Infinite health factor
        
        uint256 totalCollateral = getUserTotalCollateralValue(user);
        return (totalCollateral * 1e18) / totalDebt;
    }

    /**
     * @notice Get borrow APR for an asset (in basis points per year)
     */
    function getBorrowAPR(address asset) external view returns (uint256) {
        uint256 utilization = getUtilizationRate(asset);
        return interestRateModel.getBorrowRate(utilization);
    }

    /**
     * @notice Get supply APR for an asset (in basis points per year)
     */
    function getSupplyAPR(address asset) external view returns (uint256) {
        uint256 utilization = getUtilizationRate(asset);
        uint256 borrowRate = interestRateModel.getBorrowRate(utilization);
        return interestRateModel.getSupplyRate(utilization, borrowRate);
    }

    /**
     * @notice Get asset configuration
     */
    function getAssetConfig(address asset) external view returns (AssetConfig memory) {
        return assetConfigs[asset];
    }

    /**
     * @notice Get user's supplied assets
     */
    function getUserSuppliedAssets(address user) external view returns (address[] memory) {
        return userSuppliedAssets[user];
    }

    /**
     * @notice Get user's borrowed assets
     */
    function getUserBorrowedAssets(address user) external view returns (address[] memory) {
        return userBorrowedAssets[user];
    }

    /**
     * @notice Internal function to get token decimals
     */
    function _getDecimals(address asset) internal view returns (uint256) {
        // Try to get decimals, default to 18 if not available
        try IERC20Metadata(asset).decimals() returns (uint8 decimals) {
            return decimals;
        } catch {
            return 18;
        }
    }
}