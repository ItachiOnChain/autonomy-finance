// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAutoRepayEngine.sol";
import "./interfaces/IAutonomyVault.sol";
import "./interfaces/IIPManager.sol";
import "./interfaces/ILendingPool.sol";
import "./libraries/Errors.sol";

/**
 * @title IUniswapV2Router02
 * @notice Interface for Uniswap V2 Router
 */
interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

/**
 * @title AggregatorV3Interface
 * @notice Interface for Chainlink Price Feeds
 */
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

/**
 * @title AutoRepayEngine
 * @notice Automated debt repayment using IP royalties with token conversion
 * @dev Supports multi-token royalties, DEX conversion, and oracle price checks
 * @dev Now supports repaying debt in both AutonomyVault and LendingPool (ANY asset)
 */
contract AutoRepayEngine is IAutoRepayEngine, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IAutonomyVault public vault;
    IIPManager public ipManager;
    ILendingPool public lendingPool;

    // List of assets to check in LendingPool
    address[] public supportedAssets;

    // ===== Conversion Configuration =====

    // Uniswap router for token swaps
    IUniswapV2Router02 public router;

    // WETH address (for routing)
    address public WETH;

    // Repay token (e.g., USDC) for vault
    address public repayToken;

    // Token whitelist (token => whitelisted)
    mapping(address => bool) public whitelistedTokens;

    // Oracle addresses (token => Chainlink feed)
    mapping(address => address) public oracles;

    // Conversion fee in basis points (e.g., 10 = 0.1%)
    uint256 public conversionFeeBps = 10;

    // Protocol treasury for fees
    address public treasury;

    // Maximum slippage allowed (in basis points)
    uint256 public constant MAX_SLIPPAGE_BPS = 1000; // 10%

    // ===== Events =====

    event RoyaltyRepayInitiated(
        address indexed user,
        bytes32 indexed ipaId,
        address claimedToken,
        uint256 claimedAmount
    );

    event TokenConverted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );

    event LendingPoolRepaySucceeded(
        address indexed user,
        address indexed asset,
        uint256 repaidAmount
    );

    event RoyaltyRepaySucceeded(
        address indexed user,
        uint256 repaidAmount,
        uint256 remainingDebt
    );

    event RoyaltyRepayFailed(address indexed user, string reason);

    event OffChainConversionRequired(
        address indexed user,
        bytes32 indexed ipaId,
        address token,
        uint256 amount
    );

    event RouterUpdated(address indexed oldRouter, address indexed newRouter);
    event RepayTokenUpdated(address indexed oldToken, address indexed newToken);
    event TokenWhitelisted(address indexed token, bool status);
    event OracleSet(address indexed token, address indexed oracle);
    event ConversionFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event SupportedAssetAdded(address indexed asset);

    constructor() Ownable(msg.sender) {}

    // ===== Configuration Functions =====

    /**
     * @notice Set the vault contract
     * @param _vault Address of AutonomyVault contract
     */
    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert Errors.ZeroAddress();
        vault = IAutonomyVault(_vault);

        // Approve vault to spend repay token
        if (repayToken != address(0)) {
            IERC20(repayToken).forceApprove(_vault, type(uint256).max);
        }
    }

    /**
     * @notice Set the IP manager contract
     * @param _ipManager Address of IPManager contract
     */
    function setIPManager(address _ipManager) external onlyOwner {
        if (_ipManager == address(0)) revert Errors.ZeroAddress();
        ipManager = IIPManager(_ipManager);
    }

    /**
     * @notice Set the lending pool contract
     * @param _lendingPool Address of LendingPool contract
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        if (_lendingPool == address(0)) revert Errors.ZeroAddress();
        lendingPool = ILendingPool(_lendingPool);
    }

    /**
     * @notice Add a supported asset for LendingPool debt scanning
     * @param asset Asset address to scan for debt
     */
    function addSupportedAsset(address asset) external onlyOwner {
        require(asset != address(0), "Invalid asset");
        supportedAssets.push(asset);

        // Approve lending pool to spend this asset for repayments
        if (address(lendingPool) != address(0)) {
            IERC20(asset).forceApprove(address(lendingPool), type(uint256).max);
        }

        emit SupportedAssetAdded(asset);
    }

    /**
     * @notice Set Uniswap router
     * @param _router Router address
     */
    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router");
        address oldRouter = address(router);
        router = IUniswapV2Router02(_router);
        emit RouterUpdated(oldRouter, _router);
    }

    /**
     * @notice Set WETH address
     * @param _weth WETH address
     */
    function setWETH(address _weth) external onlyOwner {
        require(_weth != address(0), "Invalid WETH");
        WETH = _weth;
    }

    /**
     * @notice Set repay token for vault
     * @param _repayToken Repay token address
     */
    function setRepayToken(address _repayToken) external onlyOwner {
        require(_repayToken != address(0), "Invalid token");
        address oldToken = repayToken;
        repayToken = _repayToken;
        emit RepayTokenUpdated(oldToken, _repayToken);

        // Approve vault to spend repay token
        if (address(vault) != address(0)) {
            IERC20(_repayToken).forceApprove(address(vault), type(uint256).max);
        }
    }

    /**
     * @notice Set treasury address
     * @param _treasury Treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /**
     * @notice Whitelist a token for royalty payments
     * @param token Token address
     * @param status Whitelist status
     */
    function setWhitelistedToken(
        address token,
        bool status
    ) external onlyOwner {
        whitelistedTokens[token] = status;
        emit TokenWhitelisted(token, status);
    }

    /**
     * @notice Set oracle for a token
     * @param token Token address
     * @param oracle Chainlink oracle address
     */
    function setOracle(address token, address oracle) external onlyOwner {
        oracles[token] = oracle;
        emit OracleSet(token, oracle);
    }

    /**
     * @notice Set conversion fee
     * @param feeBps Fee in basis points
     */
    function setConversionFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 100, "Fee too high"); // Max 1%
        uint256 oldFee = conversionFeeBps;
        conversionFeeBps = feeBps;
        emit ConversionFeeUpdated(oldFee, feeBps);
    }

    // ===== Auto-Repay Functions =====

    /**
     * @notice Auto-repay from royalty with token conversion
     * @dev Scans ALL supported assets in LendingPool to find user's debt
     * @param ipaId IPA ID
     * @param claimedToken Token address of claimed royalties
     * @param claimedAmount Amount of claimed royalties
     * @param minRepayOut Minimum repay amount (slippage protection)
     * @param slippageBps Slippage tolerance in basis points
     * @return repaidAmount Amount repaid
     */
    function autoRepayFromRoyalty(
        bytes32 ipaId,
        address claimedToken,
        uint256 claimedAmount,
        uint256 minRepayOut,
        uint16 slippageBps,
        address preferredDebtAsset
    ) external nonReentrant returns (uint256) {
        require(slippageBps <= MAX_SLIPPAGE_BPS, "Slippage too high");

        // Get IPA owner
        address owner = ipManager.getIPAOwner(ipaId);
        require(owner != address(0), "IPA not found");
        require(msg.sender == owner, "Unauthorized");

        // Get position from vault
        IAutonomyVault.Position memory vaultPos = vault.getPosition(owner);
        bool hasVaultDebt = vaultPos.debtAmount > 0;

        // If no vault debt, scan LendingPool for borrowed assets
        address debtAsset = address(0);
        uint256 debtAmount = 0;

        if (!hasVaultDebt && address(lendingPool) != address(0)) {
            // If preferred asset is specified, check it first
            if (preferredDebtAsset != address(0)) {
                ILendingPool.UserPosition memory lpPos = lendingPool
                    .getUserPosition(owner, preferredDebtAsset);
                if (lpPos.borrowed > 0) {
                    debtAsset = preferredDebtAsset;
                    debtAmount = lpPos.borrowed;
                }
            }

            // If no preferred asset or it has no debt, scan all supported assets
            if (debtAsset == address(0)) {
                for (uint i = 0; i < supportedAssets.length; i++) {
                    ILendingPool.UserPosition memory lpPos = lendingPool
                        .getUserPosition(owner, supportedAssets[i]);

                    if (lpPos.borrowed > 0) {
                        debtAsset = supportedAssets[i];
                        debtAmount = lpPos.borrowed;
                        break; // Use first found debt asset
                    }
                }
            }

            if (debtAsset == address(0)) {
                revert Errors.NoActiveDebt();
            }
        } else if (!hasVaultDebt) {
            revert Errors.NoActiveDebt();
        }

        emit RoyaltyRepayInitiated(owner, ipaId, claimedToken, claimedAmount);

        // Determine target token for conversion
        address targetToken = hasVaultDebt ? repayToken : debtAsset;

        // Check if token is whitelisted
        if (!whitelistedTokens[claimedToken] && claimedToken != targetToken) {
            emit OffChainConversionRequired(
                owner,
                ipaId,
                claimedToken,
                claimedAmount
            );
            revert("Token not whitelisted - use off-chain conversion");
        }

        // Pull tokens from user (requires approval)
        IERC20(claimedToken).safeTransferFrom(
            msg.sender,
            address(this),
            claimedAmount
        );

        uint256 repayAmount;
        uint256 fee;

        // If claimed token is same as target token, no conversion needed
        if (claimedToken == targetToken) {
            repayAmount = claimedAmount;
        } else {
            // Convert tokens
            (repayAmount, fee) = _convertTokens(
                claimedToken,
                targetToken,
                claimedAmount,
                minRepayOut,
                slippageBps
            );
        }

        // Deduct conversion fee
        if (fee > 0 && treasury != address(0)) {
            IERC20(targetToken).safeTransfer(treasury, fee);
            repayAmount -= fee;
        }

        // Execute repayment to appropriate system
        uint256 surplus = 0;

        // Execute repayment to appropriate system
        if (hasVaultDebt) {
            // Repay to AutonomyVault

            // Cap repay amount to debt and calculate surplus
            if (repayAmount > vaultPos.debtAmount) {
                surplus = repayAmount - vaultPos.debtAmount;
                repayAmount = vaultPos.debtAmount;
            }

            vault.reduceDebt(owner, repayAmount);

            IAutonomyVault.Position memory updatedPos = vault.getPosition(
                owner
            );
            emit RoyaltyRepaySucceeded(
                owner,
                repayAmount,
                updatedPos.debtAmount
            );

            if (updatedPos.debtAmount == 0) {
                emit IPReleased(owner, address(uint160(uint256(ipaId))));
            }
        } else {
            // Repay to LendingPool

            // Cap repay amount to debt and calculate surplus
            if (repayAmount > debtAmount) {
                surplus = repayAmount - debtAmount;
                repayAmount = debtAmount;
            }

            // Approve and repay on behalf of user
            IERC20(debtAsset).forceApprove(address(lendingPool), repayAmount);
            lendingPool.repayOnBehalf(debtAsset, repayAmount, owner);

            emit LendingPoolRepaySucceeded(owner, debtAsset, repayAmount);
        }

        // Return surplus to user
        if (surplus > 0) {
            IERC20(targetToken).safeTransfer(owner, surplus);
        }

        return repayAmount;
    }

    /**
     * @notice Convert tokens using Uniswap router
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param minOut Minimum output amount
     * @param slippageBps Slippage tolerance
     * @return amountOut Output amount
     * @return fee Conversion fee
     */
    function _convertTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minOut,
        uint16 slippageBps
    ) internal returns (uint256 amountOut, uint256 fee) {
        require(address(router) != address(0), "Router not set");
        require(WETH != address(0), "WETH not set");

        // Build swap path
        address[] memory path;
        if (tokenIn == WETH || tokenOut == WETH) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = WETH;
            path[2] = tokenOut;
        }

        // Check oracle price if available
        if (oracles[tokenIn] != address(0) && oracles[tokenOut] != address(0)) {
            _checkOraclePrice(tokenIn, tokenOut, amountIn, minOut, slippageBps);
        }

        // Approve router
        IERC20(tokenIn).forceApprove(address(router), amountIn);

        // Execute swap
        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );

        amountOut = amounts[amounts.length - 1];

        // Calculate fee
        fee = (amountOut * conversionFeeBps) / 10000;

        emit TokenConverted(tokenIn, tokenOut, amountIn, amountOut, fee);

        return (amountOut, fee);
    }

    /**
     * @notice Check oracle price for sanity
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param minOut Minimum output
     * @param slippageBps Slippage tolerance
     */
    function _checkOraclePrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minOut,
        uint16 slippageBps
    ) internal view {
        AggregatorV3Interface oracleIn = AggregatorV3Interface(
            oracles[tokenIn]
        );
        AggregatorV3Interface oracleOut = AggregatorV3Interface(
            oracles[tokenOut]
        );

        (, int256 priceIn, , , ) = oracleIn.latestRoundData();
        (, int256 priceOut, , , ) = oracleOut.latestRoundData();

        require(priceIn > 0 && priceOut > 0, "Invalid oracle price");

        // Calculate expected output
        uint8 decimalsIn = oracleIn.decimals();
        uint8 decimalsOut = oracleOut.decimals();

        uint256 expectedOut = (amountIn *
            uint256(priceIn) *
            (10 ** decimalsOut)) / (uint256(priceOut) * (10 ** decimalsIn));

        // Apply slippage tolerance
        uint256 minExpected = (expectedOut * (10000 - slippageBps)) / 10000;

        require(minOut >= minExpected, "Oracle price check failed");
    }

    // ===== View Functions =====

    /**
     * @notice Get number of supported assets
     * @return Number of supported assets
     */
    function getSupportedAssetsCount() external view returns (uint256) {
        return supportedAssets.length;
    }

    /**
     * @notice Get supported asset at index
     * @param index Index
     * @return Asset address
     */
    function getSupportedAsset(uint256 index) external view returns (address) {
        require(index < supportedAssets.length, "Index out of bounds");
        return supportedAssets[index];
    }

    // ===== Legacy Functions (for backward compatibility) =====

    /**
     * @notice Simulate auto-repayment for a user
     * @param user User address
     * @return simulation Repayment simulation results
     */
    function simulateAutoRepay(
        address user
    ) external view returns (RepaymentSimulation memory) {
        IAutonomyVault.Position memory position = vault.getPosition(user);

        RepaymentSimulation memory simulation;
        simulation.currentDebt = position.debtAmount;

        if (!position.hasIP || position.debtAmount == 0) {
            return simulation;
        }

        address ipAsset = position.ipAsset;

        try ipManager.getRoyaltyBalance(ipAsset) returns (uint256 royalties) {
            simulation.royaltiesAvailable = royalties;

            if (royalties >= position.debtAmount) {
                simulation.repaymentAmount = position.debtAmount;
                simulation.remainingDebt = 0;
                simulation.willReleaseIP = true;
            } else {
                simulation.repaymentAmount = royalties;
                simulation.remainingDebt = position.debtAmount - royalties;
                simulation.willReleaseIP = false;
            }
        } catch {
            return simulation;
        }

        return simulation;
    }

    /**
     * @notice Execute auto-repayment for a user (legacy)
     * @param user User address
     * @return repaidAmount Amount repaid
     */
    function executeAutoRepay(
        address user
    ) external nonReentrant returns (uint256) {
        IAutonomyVault.Position memory position = vault.getPosition(user);

        if (position.debtAmount == 0) revert Errors.NoActiveDebt();
        if (!position.hasIP) revert Errors.IPNotLocked();

        address ipAsset = position.ipAsset;
        uint256 royalties = ipManager.getRoyaltyBalance(ipAsset);

        if (royalties == 0) revert Errors.InsufficientRoyalties();

        uint256 repayAmount = royalties >= position.debtAmount
            ? position.debtAmount
            : royalties;

        uint256 withdrawn = ipManager.withdrawRoyalties(ipAsset, repayAmount);
        require(withdrawn == repayAmount, "Royalty withdrawal failed");

        vault.reduceDebt(user, repayAmount);

        IAutonomyVault.Position memory updatedPosition = vault.getPosition(
            user
        );

        emit AutoRepayExecuted(user, repayAmount, updatedPosition.debtAmount);

        if (updatedPosition.debtAmount == 0) {
            emit IPReleased(user, ipAsset);
        }

        return repayAmount;
    }
}
