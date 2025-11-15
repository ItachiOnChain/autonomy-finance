// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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
import "../base/SafeERC20Lib.sol";

/// @notice Autonomy V1 - Self-repaying lending and borrowing protocol for Mantle
/// @dev Core protocol contract managing deposits, debt, and self-repaying loans
contract AutonomyV1 is IAutonomyV1, ReentrancyGuard, Ownable {
    using SafeERC20Lib for IERC20Minimal;
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

    /// @notice Mapping from account to debt token to debt amount (raw outstanding principal per-user)
    mapping(address => mapping(address => uint256)) public debt;

    /// @notice Mapping from debt token to total debt (protocol-level outstanding principal)
    mapping(address => uint256) public totalDebt;

    /// @notice Mapping from debt token to cumulative debt reduction factor (WAD)
    /// @dev Increased by _applyYield when yield is used to burn debt. Represents cumulative proportional reduction
    ///      factor that should be applied to each user's debt (proportionally) over time.
    mapping(address => uint256) public debtReductionFactor;

    /// @notice Per-user checkpoint of applied reduction (debtReductionFactor) to avoid double-applying
    mapping(address => mapping(address => uint256)) public debtReductionClaimed;

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
            // Check whitelist contract via staticcall
            (bool success, bytes memory data) =
                whitelist.staticcall(abi.encodeWithSignature("isWhitelisted(address)", msg.sender));
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

    /// @notice Register a yield token with its adapter
    /// @dev Uses IERC20Minimal + SafeERC20Lib for approvals
    function registerYieldToken(address yieldToken, ITokenAdapter adapter) external onlyOwner {
        if (address(adapter) == address(0)) revert Errors.InvalidAdapter();
        if (adapter.yieldToken() != IERC20Minimal(yieldToken)) revert Errors.InvalidYieldToken();
        if (isYieldTokenRegistered[yieldToken]) revert Errors.InvalidYieldToken();

        yieldTokenAdapters[yieldToken] = adapter;
        isYieldTokenRegistered[yieldToken] = true;
        registeredYieldTokens.push(yieldToken);

        // Approve adapter to burn/transfer yield tokens (for withdrawals)
        IERC20Minimal yieldTokenMinimal = IERC20Minimal(yieldToken);
        // Reset then set max to be safe for non-standard tokens
        yieldTokenMinimal.safeApprove(address(adapter), 0);
        yieldTokenMinimal.safeApprove(address(adapter), type(uint256).max);

        // Approve adapter to transfer underlying tokens from this contract
        IERC20Minimal underlying = adapter.underlyingToken();
        underlying.safeApprove(address(adapter), 0);
        underlying.safeApprove(address(adapter), type(uint256).max);

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

    /// @notice Return the total underlying value for a given yield token (shares * exchangeRate)
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

    /// @notice Return effective user debt (accounts for cumulative reduction factor not yet applied to user)
    function getDebt(address account, address debtToken) public view override returns (uint256) {
        uint256 raw = debt[account][debtToken];
        uint256 cumulative = debtReductionFactor[debtToken];
        uint256 claimed = debtReductionClaimed[debtToken][account];

        if (raw == 0 || cumulative == 0 || cumulative <= claimed) {
            return raw;
        }

        uint256 delta = cumulative - claimed;
        uint256 reduction = (raw * delta) / 1e18;
        return raw > reduction ? raw - reduction : 0;
    }

    /// @notice Compute total collateral value (underlying * price) across all registered yield tokens
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

    /// @notice Compute total debt value for an account (applies per-user reduction factor conceptually)
    function getDebtValue(address account) public view override returns (uint256) {
        uint256 totalDebtValue = 0;

        // Iterate through all registered debt tokens
        for (uint256 i = 0; i < registeredDebtTokens.length; i++) {
            address debtToken = registeredDebtTokens[i];
            uint256 userDebt = getDebt(account, debtToken);

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
    )
        external
        override
        nonReentrant
        onlyWhitelisted
        whenNotPausedFunction(bytes4(keccak256(bytes("deposit(address,uint256,address)"))))
        returns (uint256)
    {
        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();
        if (amount == 0) revert Errors.InvalidAmount();

        // Accrue yield before deposit
        _accrue(yieldToken);

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
    )
        external
        override
        nonReentrant
        onlyWhitelisted
        whenNotPausedFunction(bytes4(keccak256(bytes("withdraw(address,uint256,address)"))))
        returns (uint256)
    {
        if (shares == 0) {
            revert Errors.InvalidAmount();
        }
        if (depositedShares[msg.sender][yieldToken] < shares) revert Errors.InsufficientBalance();

        ITokenAdapter adapter = yieldTokenAdapters[yieldToken];
        if (address(adapter) == address(0)) revert Errors.InvalidYieldToken();

        // Accrue yield before withdraw
        _accrue(yieldToken);

        // Check if withdrawal would make position undercollateralized
        uint256 debtValue = getDebtValue(msg.sender);

        if (debtValue > 0) {
            uint256 collateralValue = getCollateralValue(msg.sender);
            uint256 exchangeRate = adapter.getExchangeRate();
            IERC20Minimal underlying = adapter.underlyingToken();
            uint256 price = oracle.priceInDebt(address(underlying));
            uint256 sharesValue = shares.wmul(exchangeRate).wmul(price);

            uint256 newCollateralValue = collateralValue - sharesValue;

            // Check if new ratio is below minimum
            if (newCollateralValue.wdiv(debtValue) < MINIMUM_COLLATERALIZATION_RATIO) {
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
    )
        external
        override
        nonReentrant
        onlyWhitelisted
        whenNotPausedFunction(bytes4(keccak256(bytes("mint(address,uint256,address)"))))
    {
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

    /// @notice Repay debt for `recipient` by burning `amount` of debt tokens from msg.sender.
    ///         Applies any unapplied per-user reduction (from prior auto-repay) before processing the repay.
    function repay(
        address debtToken,
        uint256 amount,
        address recipient
    )
        external
        override
        nonReentrant
        whenNotPausedFunction(bytes4(keccak256(bytes("repay(address,uint256,address)"))))
    {
        if (amount == 0) revert Errors.InvalidAmount();

        // Accrue yield before repay
        for (uint256 i = 0; i < registeredYieldTokens.length; i++) {
            _accrue(registeredYieldTokens[i]);
        }

        // --- Apply per-user reduction checkpoint (if any) ---
        uint256 currentDebtRaw = debt[recipient][debtToken];
        if (currentDebtRaw > 0) {
            uint256 cumulative = debtReductionFactor[debtToken];
            uint256 claimed = debtReductionClaimed[debtToken][recipient];
            if (cumulative > claimed) {
                uint256 delta = cumulative - claimed;
                uint256 reduction = (currentDebtRaw * delta) / 1e18;
                if (reduction > currentDebtRaw) reduction = currentDebtRaw;
                // Reduce user's raw debt (do NOT change totalDebt — totalDebt was already reduced at _applyYield time)
                debt[recipient][debtToken] = currentDebtRaw - reduction;
                // Mark user's checkpoint as up-to-date
                debtReductionClaimed[debtToken][recipient] = cumulative;
                // update variable for subsequent checks
                currentDebtRaw = debt[recipient][debtToken];
            }
        }

        // Now check that recipient has enough debt to cover the repay
        if (debt[recipient][debtToken] < amount) revert Errors.InsufficientDebt();

        // Burn the debt tokens from msg.sender (repayer)
        IERC20Burnable(debtToken).burnFrom(msg.sender, amount);

        // Decrease user debt and protocol totalDebt
        debt[recipient][debtToken] -= amount;
        totalDebt[debtToken] -= amount;

        emit Repay(recipient, debtToken, amount);
    }

    function liquidate(
        address account,
        address yieldToken,
        uint256 shares
    )
        external
        override
        nonReentrant
        whenNotPausedFunction(bytes4(keccak256(bytes("liquidate(address,address,uint256)"))))
    {
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
            uint256 accountDebt = getDebt(account, debtToken); // uses effective debt (view)
            if (accountDebt > 0) {
                uint256 debtTokenPrice = oracle.priceInDebt(debtToken);
                uint256 accountDebtValue = accountDebt.wmul(debtTokenPrice);
                uint256 debtShare = (accountDebtValue * debtToRepay) / totalAccountDebt;
                uint256 debtShareAmount = debtShare.wdiv(debtTokenPrice);

                if (debtShareAmount > accountDebt) debtShareAmount = accountDebt;

                // Burn debt tokens from liquidator (they need to have them)
                IERC20Burnable(debtToken).burnFrom(msg.sender, debtShareAmount);

                // Reduce raw stored debt for the account and totalDebt
                // Note: we must also update the raw debt mapping directly (these users may have unapplied reductions)
                // To be consistent, apply the user's checkpoint before subtracting:
                uint256 rawDebt = debt[account][debtToken];
                uint256 cumulative = debtReductionFactor[debtToken];
                uint256 claimed = debtReductionClaimed[debtToken][account];
                if (rawDebt > 0 && cumulative > claimed) {
                    uint256 delta = cumulative - claimed;
                    uint256 reduction = (rawDebt * delta) / 1e18;
                    if (reduction > rawDebt) reduction = rawDebt;
                    rawDebt = rawDebt - reduction;
                    debtReductionClaimed[debtToken][account] = cumulative;
                }

                // Now apply liquidation burn
                if (debtShareAmount > rawDebt) debtShareAmount = rawDebt;
                debt[account][debtToken] = rawDebt - debtShareAmount;
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
    function harvest(address yieldToken)
        external
        override
        nonReentrant
        whenNotPausedFunction(bytes4(keccak256(bytes("harvest(address)"))))
        returns (uint256)
    {
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
    /// @param yield The yield amount (in adapter-specific units)
    /// @return amountBurned Amount of debt tokens burned (sum across debt tokens)
    ///
    /// NOTE: `yield` is expected to be in the form adapters provide (for CometAdapter it's a per-share WAD factor).
    /// `_applyYield` converts that into value in debt units and uses it to burn debt tokens proportionally across debt tokens.
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
                // Reduce protocol total debt (these tokens will be minted and burned)
                totalDebt[debtToken] -= debtShareAmount;

                // Track cumulative reduction factor for proportional user debt reduction
                // This allows us to reduce user debt proportionally on next interaction
                if (debtTokenTotalDebt > 0) {
                    // reductionFactor is a WAD value representing proportion of previous total debt removed
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
