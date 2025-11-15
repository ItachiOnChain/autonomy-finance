// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITokenAdapter.sol";
import "../interfaces/IERC20Minimal.sol";
import "../tokens/MintableBurnableERC20.sol";
import "../base/FixedPointMath.sol";
import "../base/SafeERC20Lib.sol";

/// @notice Yield adapter for Autonomy V1
/// @dev Simulates yield accrual through a configurable APY.
///      NOTE: Uses a linear APY approximation for the hackathon MVP.
contract Adapter is ITokenAdapter, ReentrancyGuard, Ownable {
    using FixedPointMath for uint256;
    using SafeERC20Lib for IERC20Minimal;

    IERC20Minimal public immutable underlyingToken;
    MintableBurnableERC20 public immutable _yieldToken;

    uint256 public exchangeRate; // Stored as WAD (1e18 = 1:1)
    uint256 public lastUpdateTime;

    /// @notice APY expressed in WAD (1e18 = 100%)
    uint256 public apy;

    uint256 private constant SECONDS_PER_YEAR = 365 days;

    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);
    event YieldAccrued(uint256 yield);

    constructor(
        address initialOwner,
        IERC20Minimal underlyingToken_,
        string memory yieldTokenName,
        string memory yieldTokenSymbol,
        uint256 initialExchangeRate,
        uint256 apy_
    )
        Ownable(initialOwner)
    {
        underlyingToken = underlyingToken_;
        _yieldToken = new MintableBurnableERC20(yieldTokenName, yieldTokenSymbol, 18);
        _yieldToken.setMinter(address(this));

        exchangeRate = initialExchangeRate;
        apy = apy_;
        lastUpdateTime = block.timestamp;
    }

    /// @notice Yield token ERC20
    function yieldToken() external view override returns (IERC20Minimal) {
        return IERC20Minimal(address(_yieldToken));
    }

    function getExchangeRate() external view override returns (uint256) {
        return _getCurrentExchangeRate();
    }

    /// @notice Deposit underlying & mint yield shares to recipient
    function deposit(uint256 amount, address recipient) external override nonReentrant returns (uint256) {
        _updateExchangeRate();

        // Pull underlying from caller (uses local SafeERC20Lib)
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 shares = amount.wdiv(exchangeRate);
        _yieldToken.mint(recipient, shares);

        return shares;
    }

    /// ------------------------------------------------------------------------
    /// Custodial-flow semantics for Autonomy integration
    ///
    /// Autonomy holds the yield tokens, so `msg.sender` must be the one whose
    /// yield tokens are burned. Recipient only receives the underlying.
    /// ------------------------------------------------------------------------
    function withdraw(uint256 shares, address recipient) external override nonReentrant returns (uint256) {
        _updateExchangeRate();

        // Burn yield tokens from caller (Autonomy/core)
        _yieldToken.burnFrom(msg.sender, shares);

        uint256 amount = shares.wmul(exchangeRate);
        // Use local SafeERC20Lib for safe transfer
        underlyingToken.safeTransfer(recipient, amount);

        return amount;
    }

    function accrue() external override {
        _updateExchangeRate();
    }

    function harvest() external override returns (uint256) {
        uint256 oldRate = exchangeRate;
        _updateExchangeRate();
        uint256 yield = exchangeRate > oldRate ? exchangeRate - oldRate : 0;
        emit YieldAccrued(yield);
        return yield;
    }

    function totalValue() external view override returns (uint256) {
        uint256 totalShares = _yieldToken.totalSupply();
        return totalShares.wmul(_getCurrentExchangeRate());
    }

    function setAPY(uint256 apy_) external onlyOwner {
        _updateExchangeRate();
        uint256 old = apy;
        apy = apy_;
        emit APYUpdated(old, apy_);
    }

    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        // Use local SafeERC20Lib with IERC20Minimal cast
        IERC20Minimal(token).safeTransfer(to, amount);
    }

    function pokeYield() external {
        _updateExchangeRate();
    }

    // ------------------------------------------------------------------------

    function _getCurrentExchangeRate() internal view returns (uint256) {
        if (_yieldToken.totalSupply() == 0) {
            return exchangeRate;
        }

        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        if (timeElapsed == 0) return exchangeRate;

        uint256 rateMultiplier = FixedPointMath.WAD + (apy * timeElapsed) / SECONDS_PER_YEAR;

        return exchangeRate.wmul(rateMultiplier);
    }

    function _updateExchangeRate() internal {
        uint256 oldRate = exchangeRate;
        uint256 newRate = _getCurrentExchangeRate();
        if (newRate != oldRate) {
            exchangeRate = newRate;
            emit ExchangeRateUpdated(oldRate, newRate);
        }
        lastUpdateTime = block.timestamp;
    }
}
