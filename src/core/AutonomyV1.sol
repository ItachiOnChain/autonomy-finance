// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IAutonomyV1.sol";
import "../interfaces/ITokenAdapter.sol";
import "../interfaces/IERC20Minimal.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/IERC20Burnable.sol";
import "../interfaces/IPriceOracle.sol";
import "../tokens/MintableERC20.sol";
import "../base/FixedPointMath.sol";
import "../base/SafeCast.sol";
import "../base/Errors.sol";

/// @notice Autonomy V1 - Self-repaying lending and borrowing protocol for Mantle
/// @dev Core protocol contract managing deposits, debt, and self-repaying loans
contract AutonomyV1 is IAutonomyV1, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using FixedPointMath for uint256;
    using SafeCast for uint256;

    // ============ Constants ============

    uint256 public constant MAX_LIQUIDATION_BONUS = 0.1e18; // 10% max liquidation bonus
    uint256 public constant MINIMUM_COLLATERALIZATION_RATIO = 1.5e18; // 150% minimum
    uint256 public constant LIQUIDATION_THRESHOLD = 1.2e18; // 120% liquidation threshold

    // ============ Storage ============

    /// @notice Price oracle for token pricing
    IPriceOracle public oracle;

    /// @notice Whitelist for compliance (optional)
    address public whitelist;

    /// @notice Mapping from yield token to adapter
    mapping(address => ITokenAdapter) public yieldTokenAdapters;

    /// @notice Mapping from debt token to mintable token
    mapping(address => MintableERC20) public debtTokens;

    /// @notice Mapping from yield token to total deposited shares
    mapping(address => uint256) public totalDepositedShares;

    /// @notice Mapping from account to yield token to deposited shares
    mapping(address => mapping(address => uint256)) public depositedShares;

    /// @notice Mapping from account to debt token to debt amount
    mapping(address => mapping(address => uint256)) public debt;

    /// @notice Mapping from debt token to total debt
    mapping(address => uint256) public totalDebt;
    
    /// @notice Mapping from debt token to cumulative debt reduction (for auto-repay)
    /// @dev Used to track proportional debt reduction across all users
    mapping(address => uint256) public debtReductionFactor;

    /// @notice Array of registered yield tokens
    address[] public registeredYieldTokens;

    /// @notice Array of registered debt tokens
    address[] public registeredDebtTokens;

    /// @notice Mapping to check if yield token is registered
    mapping(address => bool) public isYieldTokenRegistered;

    /// @notice Mapping to check if debt token is registered
    mapping(address => bool) public isDebtTokenRegistered;

    /// @notice Granular pause flags
    mapping(bytes4 => bool) public pausedFunctions;

    // ============ Events ============

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event WhitelistUpdated(address indexed oldWhitelist, address indexed newWhitelist);
    event YieldTokenRegistered(address indexed yieldToken, address indexed adapter);
    event DebtTokenRegistered(address indexed debtToken);
    event FunctionPaused(bytes4 indexed selector);
    event FunctionUnpaused(bytes4 indexed selector);
    event AutoRepay(address indexed yieldToken, uint256 amountBurned);

    // ============ Modifiers ============

    modifier whenNotPausedFunction(bytes4 selector) {
        if (pausedFunctions[selector]) revert Errors.Paused();
        _;
    }

    modifier onlyWhitelisted() {
        if (whitelist != address(0)) {
            // Check whitelist
            (bool success, bytes memory data) = whitelist.staticcall(
                abi.encodeWithSignature("isWhitelisted(address)", msg.sender)
            );
            if (!success || data.length == 0) revert Errors.NotWhitelisted();
            bool isWhitelisted = abi.decode(data, (bool));
            if (!isWhitelisted) revert Errors.NotWhitelisted();
        }
        _;
    }

    // ============ Constructor ============

    constructor(address initialOwner, IPriceOracle oracle_) Ownable(initialOwner) {
        oracle = oracle_;
    }

    // ============ Admin Functions ============

    function setOracle(IPriceOracle oracle_) external onlyOwner {
        address oldOracle = address(oracle);
        oracle = oracle_;
        emit OracleUpdated(oldOracle, address(oracle_));
    }

    function setWhitelist(address whitelist_) external onlyOwner {
        address oldWhitelist = whitelist;
        whitelist = whitelist_;
        emit WhitelistUpdated(oldWhitelist, whitelist_);
    }

    function registerYieldToken(address yieldToken, ITokenAdapter adapter) external onlyOwner {
        if (address(adapter) == address(0)) revert Errors.InvalidAdapter();
        if (adapter.yieldToken() != IERC20Minimal(yieldToken)) revert Errors.InvalidYieldToken();
        if (isYieldTokenRegistered[yieldToken]) revert Errors.InvalidYieldToken();
        
        yieldTokenAdapters[yieldToken] = adapter;
        isYieldTokenRegistered[yieldToken] = true;
        registeredYieldTokens.push(yieldToken);
        
        // Approve adapter to burn yield tokens (for withdrawals)
        IERC20 yieldTokenERC20 = IERC20(yieldToken);
        yieldTokenERC20.forceApprove(address(adapter), type(uint256).max);
        
        // Approve adapter to transfer underlying tokens from this contract
        IERC20Minimal underlying = adapter.underlyingToken();
        IERC20 underlyingERC20 = IERC20(address(underlying));
        underlyingERC20.forceApprove(address(adapter), type(uint256).max);
        
        emit YieldTokenRegistered(yieldToken, address(adapter));
    }

    function registerDebtToken(address debtToken) external onlyOwner {
        if (debtToken == address(0)) revert Errors.InvalidDebtToken();
        if (isDebtTokenRegistered[debtToken]) revert Errors.InvalidDebtToken();
        
        debtTokens[debtToken] = MintableERC20(debtToken);
        isDebtTokenRegistered[debtToken] = true;
        registeredDebtTokens.push(debtToken);
        
        emit DebtTokenRegistered(debtToken);
    }

    function pauseFunction(bytes4 selector) external onlyOwner {
        pausedFunctions[selector] = true;
        emit FunctionPaused(selector);
    }

    function unpauseFunction(bytes4 selector) external onlyOwner {
        pausedFunctions[selector] = false;
        emit FunctionUnpaused(selector);
    }

    // ============ View Functions ============

    function getTotalDeposited(address yieldToken) external view override returns (uint256) {
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();
        
        uint256 shares = totalDepositedShares[yieldToken];
        uint256 exchangeRate = adapter.getExchangeRate();
        return shares.wmul(exchangeRate);
    }

    function getTotalDebt(address debtToken) external view override returns (uint256) {
        return totalDebt[debtToken];
    }

    function getDebt(address account, address debtToken) external view override returns (uint256) {
        return debt[account][debtToken];
    }

    function getCollateralValue(address account) public view override returns (uint256) {
        uint256 totalValue = 0;
        
        // Iterate through all registered yield tokens
        for (uint256 i = 0; i < registeredYieldTokens.length; i++) {
            address yieldToken = registeredYieldTokens[i];
            uint256 shares = depositedShares[account][yieldToken];
            
            if (shares > 0) {
                ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
                uint256 exchangeRate = adapter.getExchangeRate();
                uint256 underlyingAmount = shares.wmul(exchangeRate);
                
                // Get price from oracle
                IERC20Minimal underlying = adapter.underlyingToken();
                uint256 price = oracle.priceInDebt(address(underlying));
                uint256 value = underlyingAmount.wmul(price);
                totalValue += value;
            }
        }
        
        return totalValue;
    }

    function getDebtValue(address account) public view override returns (uint256) {
        uint256 totalDebtValue = 0;
        
        // Iterate through all registered debt tokens
        for (uint256 i = 0; i < registeredDebtTokens.length; i++) {
            address debtToken = registeredDebtTokens[i];
            uint256 userDebt = debt[account][debtToken];
            
            // Apply debt reduction factor if any
            if (userDebt > 0 && debtReductionFactor[debtToken] > 0) {
                uint256 reduction = (userDebt * debtReductionFactor[debtToken]) / 1e18;
                userDebt = userDebt > reduction ? userDebt - reduction : 0;
            }
            
            // Get price from oracle (debt token price in debt units)
            uint256 price = oracle.priceInDebt(debtToken);
            totalDebtValue += userDebt.wmul(price);
        }
        
        return totalDebtValue;
    }

    function getLiquidationLimit(address account) public view override returns (uint256) {
        uint256 collateralValue = getCollateralValue(account);
        return collateralValue.wdiv(MINIMUM_COLLATERALIZATION_RATIO);
    }

    function isLiquidatable(address account) public view override returns (bool) {
        uint256 collateralValue = getCollateralValue(account);
        uint256 debtValue = getDebtValue(account);
        
        if (debtValue == 0) return false;
        
        uint256 ratio = collateralValue.wdiv(debtValue);
        return ratio < LIQUIDATION_THRESHOLD;
    }

    // ============ User Functions ============

    function deposit(
        address yieldToken,
        uint256 amount,
        address recipient
    ) external override nonReentrant whenNotPausedFunction(bytes4(keccak256(bytes("deposit(address,uint256,address)")))) onlyWhitelisted returns (uint256) {
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();
        if (amount == 0) revert Errors.InvalidAmount();

        // Accrue yield before deposit
        _accrue(yieldToken);

        IERC20Minimal underlying = adapter.underlyingToken();
        IERC20(address(underlying)).safeTransferFrom(msg.sender, address(this), amount);

        uint256 shares = adapter.deposit(amount, address(this));
        
        totalDepositedShares[yieldToken] += shares;
        depositedShares[recipient][yieldToken] += shares;

        emit Deposit(msg.sender, yieldToken, amount, shares);
        return shares;
    }

    function withdraw(
        address yieldToken,
        uint256 shares,
        address recipient
    ) external override nonReentrant whenNotPausedFunction(bytes4(keccak256(bytes("withdraw(address,uint256,address)")))) onlyWhitelisted returns (uint256) {
        if (shares == 0) revert Errors.InvalidAmount();
        if (depositedShares[msg.sender][yieldToken] < shares) revert Errors.InsufficientBalance();

        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();

        // Accrue yield before withdraw
        _accrue(yieldToken);

        // Check if withdrawal would make position undercollateralized
        uint256 collateralValue = getCollateralValue(msg.sender);
        uint256 debtValue = getDebtValue(msg.sender);
        
        if (debtValue > 0) {
            uint256 exchangeRate = adapter.getExchangeRate();
            IERC20Minimal underlying = adapter.underlyingToken();
            uint256 price = oracle.priceInDebt(address(underlying));
            uint256 sharesValue = shares.wmul(exchangeRate).wmul(price);
            
            if (sharesValue > collateralValue) {
                revert Errors.InsufficientCollateral();
            }
            uint256 newCollateralValue = collateralValue - sharesValue;
            
            // If new collateral is 0 or ratio is below minimum, revert
            if (newCollateralValue == 0 || newCollateralValue.wdiv(debtValue) < MINIMUM_COLLATERALIZATION_RATIO) {
                revert Errors.InsufficientCollateral();
            }
        }

        depositedShares[msg.sender][yieldToken] -= shares;
        totalDepositedShares[yieldToken] -= shares;

        // Adapter will burn the yield tokens
        uint256 amount = adapter.withdraw(shares, recipient);

        emit Withdraw(msg.sender, yieldToken, amount, shares);
        return amount;
    }

    function mint(
        address debtToken,
        uint256 amount,
        address recipient
    ) external override nonReentrant whenNotPausedFunction(bytes4(keccak256(bytes("mint(address,uint256,address)")))) onlyWhitelisted {
        if (amount == 0) revert Errors.InvalidAmount();
        if (address(debtTokens[debtToken]) == address(0)) revert Errors.InvalidDebtToken();

        // Accrue yield for all yield tokens before mint
        for (uint256 i = 0; i < registeredYieldTokens.length; i++) {
            _accrue(registeredYieldTokens[i]);
        }

        // Check collateralization
        uint256 collateralValue = getCollateralValue(msg.sender);
        uint256 currentDebtValue = getDebtValue(msg.sender);
        uint256 price = oracle.priceInDebt(debtToken);
        uint256 newDebtValue = currentDebtValue + amount.wmul(price);

        if (collateralValue.wdiv(newDebtValue) < MINIMUM_COLLATERALIZATION_RATIO) {
            revert Errors.InsufficientCollateral();
        }

        debt[msg.sender][debtToken] += amount;
        totalDebt[debtToken] += amount;

        debtTokens[debtToken].mint(recipient, amount);

        emit Mint(msg.sender, debtToken, amount);
    }

    function repay(
        address debtToken,
        uint256 amount,
        address recipient
    ) external override nonReentrant whenNotPausedFunction(bytes4(keccak256(bytes("repay(address,uint256,address)")))) {
        if (amount == 0) revert Errors.InvalidAmount();
        if (debt[recipient][debtToken] < amount) revert Errors.InsufficientDebt();

        // Accrue yield before repay
        for (uint256 i = 0; i < registeredYieldTokens.length; i++) {
            _accrue(registeredYieldTokens[i]);
        }

        // Apply debt reduction if any
        uint256 currentDebt = debt[recipient][debtToken];
        if (currentDebt > 0 && debtReductionFactor[debtToken] > 0) {
            uint256 reduction = (currentDebt * debtReductionFactor[debtToken]) / 1e18;
            if (reduction > currentDebt) reduction = currentDebt;
            debt[recipient][debtToken] = currentDebt - reduction;
            totalDebt[debtToken] -= reduction;
            debtReductionFactor[debtToken] = 0; // Reset after applying
        }
        
        IERC20Burnable(debtToken).burnFrom(msg.sender, amount);

        debt[recipient][debtToken] -= amount;
        totalDebt[debtToken] -= amount;

        emit Repay(recipient, debtToken, amount);
    }

    function liquidate(
        address account,
        address yieldToken,
        uint256 shares
    ) external override nonReentrant whenNotPausedFunction(bytes4(keccak256(bytes("liquidate(address,address,uint256)")))) {
        if (!isLiquidatable(account)) revert Errors.InvalidPosition();
        if (shares == 0) revert Errors.InvalidAmount();
        if (depositedShares[account][yieldToken] < shares) revert Errors.InsufficientBalance();

        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();

        // Accrue yield before liquidation
        _accrue(yieldToken);

        uint256 exchangeRate = adapter.getExchangeRate();
        IERC20Minimal underlying = adapter.underlyingToken();
        uint256 price = oracle.priceInDebt(address(underlying));
        uint256 sharesValue = shares.wmul(exchangeRate).wmul(price);
        uint256 liquidationBonus = sharesValue.wmul(MAX_LIQUIDATION_BONUS);
        uint256 maxDebtToRepay = sharesValue + liquidationBonus;

        // Calculate total debt to determine repayment proportions
        uint256 totalAccountDebt = getDebtValue(account);
        if (totalAccountDebt == 0) revert Errors.InsufficientDebt();

        // Repay debt proportionally across all debt tokens
        uint256 debtToRepay = (maxDebtToRepay > totalAccountDebt) ? totalAccountDebt : maxDebtToRepay;
        
        for (uint256 i = 0; i < registeredDebtTokens.length; i++) {
            address debtToken = registeredDebtTokens[i];
            uint256 accountDebt = debt[account][debtToken];
            
            if (accountDebt > 0) {
                uint256 debtTokenPrice = oracle.priceInDebt(debtToken);
                uint256 accountDebtValue = accountDebt.wmul(debtTokenPrice);
                uint256 debtShare = (accountDebtValue * debtToRepay) / totalAccountDebt;
                uint256 debtShareAmount = debtShare.wdiv(debtTokenPrice);
                
                if (debtShareAmount > accountDebt) debtShareAmount = accountDebt;
                
                // Burn debt tokens from liquidator (they need to have them)
                IERC20Burnable(debtToken).burnFrom(msg.sender, debtShareAmount);
                
                debt[account][debtToken] -= debtShareAmount;
                totalDebt[debtToken] -= debtShareAmount;
            }
        }

        depositedShares[account][yieldToken] -= shares;
        totalDepositedShares[yieldToken] -= shares;

        // Transfer liquidated shares to liquidator
        adapter.withdraw(shares, msg.sender);

        emit Liquidate(account, yieldToken, shares);
    }

    // ============ Keeper Functions ============

    function harvest(address yieldToken) external override nonReentrant whenNotPausedFunction(bytes4(keccak256(bytes("harvest(address)")))) returns (uint256) {
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();

        // Harvest yield (adapter.harvest() returns the yield amount)
        uint256 actualYield = adapter.harvest();
        
        // Apply yield to reduce debt (auto-repay)
        uint256 amountBurned = _applyYield(yieldToken, actualYield);

        emit Harvest(yieldToken, actualYield);
        if (amountBurned > 0) {
            emit AutoRepay(yieldToken, amountBurned);
        }
        return actualYield;
    }

    // ============ Internal Functions ============

    /// @notice Accrue yield for a yield token
    /// @dev Called before state-changing operations to prevent stale index manipulation
    function _accrue(address yieldToken) internal {
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) != address(0)) {
            adapter.accrue();
        }
    }

    /// @notice Apply yield to reduce debt (auto-repay)
    /// @param yieldToken The yield token that generated yield
    /// @param yield The yield amount (in exchange rate units)
    /// @return amountBurned Amount of debt tokens burned
    function _applyYield(address yieldToken, uint256 yield) internal returns (uint256) {
        if (totalDepositedShares[yieldToken] == 0) return 0;

        // Calculate total yield value in debt units
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        IERC20Minimal underlying = adapter.underlyingToken();
        uint256 price = oracle.priceInDebt(address(underlying));
        uint256 totalShares = totalDepositedShares[yieldToken];
        uint256 yieldValue = totalShares.wmul(yield).wmul(price);

        if (yieldValue == 0) return 0;

        // Apply yield proportionally to reduce debt across all debt tokens
        uint256 totalDebtValue = 0;
        for (uint256 i = 0; i < registeredDebtTokens.length; i++) {
            totalDebtValue += totalDebt[registeredDebtTokens[i]].wmul(oracle.priceInDebt(registeredDebtTokens[i]));
        }

        if (totalDebtValue == 0) return 0;

        uint256 totalBurned = 0;
        for (uint256 i = 0; i < registeredDebtTokens.length; i++) {
            address debtToken = registeredDebtTokens[i];
            uint256 debtTokenTotalDebt = totalDebt[debtToken];
            if (debtTokenTotalDebt == 0) continue;

            uint256 debtTokenPrice = oracle.priceInDebt(debtToken);
            uint256 debtTokenValue = debtTokenTotalDebt.wmul(debtTokenPrice);
            uint256 debtShare = (debtTokenValue * yieldValue) / totalDebtValue;
            uint256 debtShareAmount = debtShare.wdiv(debtTokenPrice);

            if (debtShareAmount > debtTokenTotalDebt) {
                debtShareAmount = debtTokenTotalDebt;
            }

            if (debtShareAmount > 0) {
                // Reduce total debt
                totalDebt[debtToken] -= debtShareAmount;
                
                // Track reduction factor for proportional user debt reduction
                // This allows us to reduce user debt proportionally on next interaction
                if (debtTokenTotalDebt > 0) {
                    uint256 reductionFactor = (debtShareAmount * 1e18) / debtTokenTotalDebt;
                    debtReductionFactor[debtToken] += reductionFactor;
                }
                
                // Mint debt tokens to protocol and burn them (auto-repay)
                debtTokens[debtToken].mint(address(this), debtShareAmount);
                IERC20Burnable(debtToken).burn(debtShareAmount);
                totalBurned += debtShareAmount;
            }
        }

        return totalBurned;
    }
}
