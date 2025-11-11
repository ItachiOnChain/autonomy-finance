// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IAutonomyV1.sol";
import "../interfaces/ITokenAdapter.sol";
import "../interfaces/IERC20Minimal.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/IERC20Burnable.sol";
import "../tokens/MintableERC20.sol";
import "../base/FixedPointMath.sol";
import "../base/SafeERC20.sol";
import "../base/SafeCast.sol";
import "../base/Errors.sol";

/// @notice Autonomy V1 - Self-repaying lending and borrowing protocol for Mantle
/// @dev Core protocol contract managing deposits, debt, and self-repaying loans
contract AutonomyV1 is IAutonomyV1 {
    using SafeERC20 for IERC20Minimal;
    using FixedPointMath for uint256;
    using SafeCast for uint256;

    // ============ Constants ============

    uint256 public constant MAX_LIQUIDATION_BONUS = 0.1e18; // 10% max liquidation bonus
    uint256 public constant MINIMUM_COLLATERALIZATION_RATIO = 1.5e18; // 150% minimum
    uint256 public constant LIQUIDATION_THRESHOLD = 1.2e18; // 120% liquidation threshold

    // ============ Storage ============

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

    /// @notice Array of registered yield tokens
    address[] public registeredYieldTokens;

    /// @notice Array of registered debt tokens
    address[] public registeredDebtTokens;

    /// @notice Mapping to check if yield token is registered
    mapping(address => bool) public isYieldTokenRegistered;

    /// @notice Mapping to check if debt token is registered
    mapping(address => bool) public isDebtTokenRegistered;

    /// @notice Admin address
    address public admin;

    /// @notice Pause state
    bool public paused;

    // ============ Events ============

    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event YieldTokenRegistered(address indexed yieldToken, address indexed adapter);
    event DebtTokenRegistered(address indexed debtToken);
    event Paused(address indexed account);
    event Unpaused(address indexed account);

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Errors.Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Errors.Paused();
        _;
    }

    // ============ Constructor ============

    constructor() {
        admin = msg.sender;
    }

    // ============ Admin Functions ============

    function setAdmin(address newAdmin) external onlyAdmin {
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    function registerYieldToken(address yieldToken, ITokenAdapter adapter) external onlyAdmin {
        if (address(adapter) == address(0)) revert Errors.InvalidAdapter();
        if (adapter.yieldToken() != IERC20Minimal(yieldToken)) revert Errors.InvalidYieldToken();
        if (isYieldTokenRegistered[yieldToken]) revert Errors.InvalidYieldToken();
        
        yieldTokenAdapters[yieldToken] = adapter;
        isYieldTokenRegistered[yieldToken] = true;
        registeredYieldTokens.push(yieldToken);
        
        // Approve adapter to burn yield tokens (for withdrawals)
        IERC20Minimal(yieldToken).approve(address(adapter), type(uint256).max);
        
        // Approve adapter to transfer underlying tokens from this contract
        IERC20Minimal underlying = adapter.underlyingToken();
        underlying.approve(address(adapter), type(uint256).max);
        
        emit YieldTokenRegistered(yieldToken, address(adapter));
    }

    function registerDebtToken(address debtToken) external onlyAdmin {
        if (debtToken == address(0)) revert Errors.InvalidDebtToken();
        if (isDebtTokenRegistered[debtToken]) revert Errors.InvalidDebtToken();
        
        debtTokens[debtToken] = MintableERC20(debtToken);
        isDebtTokenRegistered[debtToken] = true;
        registeredDebtTokens.push(debtToken);
        
        emit DebtTokenRegistered(debtToken);
    }

    function pause() external onlyAdmin {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyAdmin {
        paused = false;
        emit Unpaused(msg.sender);
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
                uint256 value = shares.wmul(exchangeRate);
                totalValue += value;
            }
        }
        
        return totalValue;
    }

    function getDebtValue(address account) public view override returns (uint256) {
        uint256 totalDebtValue = 0;
        
        // Iterate through all registered debt tokens
        // For MVP, assume 1:1 value (debt tokens are pegged to underlying)
        for (uint256 i = 0; i < registeredDebtTokens.length; i++) {
            address debtToken = registeredDebtTokens[i];
            totalDebtValue += debt[account][debtToken];
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
    ) external override whenNotPaused returns (uint256) {
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();
        if (amount == 0) revert Errors.InvalidAmount();

        IERC20Minimal underlying = adapter.underlyingToken();
        underlying.safeTransferFrom(msg.sender, address(this), amount);

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
    ) external override whenNotPaused returns (uint256) {
        if (shares == 0) revert Errors.InvalidAmount();
        if (depositedShares[msg.sender][yieldToken] < shares) revert Errors.InsufficientBalance();

        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();

        // Check if withdrawal would make position undercollateralized
        uint256 collateralValue = getCollateralValue(msg.sender);
        uint256 debtValue = getDebtValue(msg.sender);
        
        if (debtValue > 0) {
            uint256 sharesValue = shares.wmul(adapter.getExchangeRate());
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
    ) external override whenNotPaused {
        if (amount == 0) revert Errors.InvalidAmount();
        if (address(debtTokens[debtToken]) == address(0)) revert Errors.InvalidDebtToken();

        // Check collateralization
        uint256 collateralValue = getCollateralValue(msg.sender);
        uint256 currentDebtValue = getDebtValue(msg.sender);
        uint256 newDebtValue = currentDebtValue + amount;

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
    ) external override whenNotPaused {
        if (amount == 0) revert Errors.InvalidAmount();
        if (debt[recipient][debtToken] < amount) revert Errors.InsufficientDebt();

        IERC20Burnable(debtToken).burnFrom(msg.sender, amount);

        debt[recipient][debtToken] -= amount;
        totalDebt[debtToken] -= amount;

        emit Repay(recipient, debtToken, amount);
    }

    function liquidate(
        address account,
        address yieldToken,
        uint256 shares
    ) external override whenNotPaused {
        if (!isLiquidatable(account)) revert Errors.InvalidPosition();
        if (shares == 0) revert Errors.InvalidAmount();
        if (depositedShares[account][yieldToken] < shares) revert Errors.InsufficientBalance();

        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();

        uint256 sharesValue = shares.wmul(adapter.getExchangeRate());
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
                uint256 debtShare = (accountDebt * debtToRepay) / totalAccountDebt;
                if (debtShare > accountDebt) debtShare = accountDebt;
                
                // Burn debt tokens from liquidator (they need to have them)
                IERC20Burnable(debtToken).burnFrom(msg.sender, debtShare);
                
                debt[account][debtToken] -= debtShare;
                totalDebt[debtToken] -= debtShare;
            }
        }

        depositedShares[account][yieldToken] -= shares;
        totalDepositedShares[yieldToken] -= shares;

        // Transfer liquidated shares to liquidator
        adapter.withdraw(shares, msg.sender);

        emit Liquidate(account, yieldToken, shares);
    }

    // ============ Keeper Functions ============

    function harvest(address yieldToken) external override whenNotPaused returns (uint256) {
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();

        uint256 yield = adapter.harvest();
        
        // Apply yield to reduce debt proportionally
        // For MVP, we'll apply it to reduce all debts proportionally
        _applyYield(yieldToken, yield);

        emit Harvest(yieldToken, yield);
        return yield;
    }

    // ============ Internal Functions ============

    function _applyYield(address yieldToken, uint256 yield) internal {
        // Simplified: apply yield to reduce debt proportionally
        // In production, you'd want more sophisticated yield distribution
        if (totalDepositedShares[yieldToken] == 0) return;

        // For MVP, we'll just update the exchange rate in the adapter
        // The actual debt reduction happens through the increased collateral value
    }
}

