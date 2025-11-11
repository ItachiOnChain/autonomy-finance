// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/ITokenAdapter.sol";
import "../interfaces/IERC20Minimal.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/IERC20Burnable.sol";
import "../tokens/MintableBurnableERC20.sol";
import "../base/FixedPointMath.sol";
import "../base/SafeERC20.sol";
import "../base/Errors.sol";

/// @notice Yield adapter for Autonomy V1
/// @dev Simulates yield accrual through a configurable APY
contract Adapter is ITokenAdapter {
    using SafeERC20 for IERC20Minimal;
    using FixedPointMath for uint256;

    IERC20Minimal public immutable underlyingToken;
    MintableBurnableERC20 public immutable _yieldToken;

    uint256 public exchangeRate; // Stored as WAD (1e18 = 1:1)
    uint256 public lastUpdateTime;
    uint256 public apy; // Annual percentage yield in WAD (e.g., 1e17 = 10%)

    address public admin;

    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);
    event YieldAccrued(uint256 yield);

    constructor(
        IERC20Minimal underlyingToken_,
        string memory yieldTokenName,
        string memory yieldTokenSymbol,
        uint256 initialExchangeRate,
        uint256 apy_
    ) {
        underlyingToken = underlyingToken_;
        _yieldToken = new MintableBurnableERC20(yieldTokenName, yieldTokenSymbol, 18);
        // Set this adapter as the minter for the yield token
        _yieldToken.setMinter(address(this));
        exchangeRate = initialExchangeRate;
        apy = apy_;
        lastUpdateTime = block.timestamp;
        admin = msg.sender;
    }

    /// @notice Get the yield token (implements ITokenAdapter interface)
    function yieldToken() external view override returns (IERC20Minimal) {
        return IERC20Minimal(address(_yieldToken));
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Errors.Unauthorized();
        _;
    }

    /// @notice Get current exchange rate (yield token / underlying token)
    function getExchangeRate() external view override returns (uint256) {
        return _getCurrentExchangeRate();
    }

    /// @notice Deposit underlying tokens and receive yield tokens
    function deposit(uint256 amount, address recipient) external override returns (uint256) {
        _updateExchangeRate();
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 shares = amount.wdiv(exchangeRate);
        _yieldToken.mint(recipient, shares);
        
        return shares;
    }

    /// @notice Withdraw underlying tokens by burning yield tokens
    function withdraw(uint256 shares, address recipient) external override returns (uint256) {
        _updateExchangeRate();
        
        // Burn yield tokens from caller (Autonomy contract)
        _yieldToken.burnFrom(msg.sender, shares);
        
        // Calculate amount based on current exchange rate
        uint256 amount = shares.wmul(exchangeRate);
        underlyingToken.safeTransfer(recipient, amount);
        
        return amount;
    }

    /// @notice Harvest yield (simulated - just updates exchange rate)
    function harvest() external override returns (uint256) {
        uint256 oldRate = exchangeRate;
        _updateExchangeRate();
        uint256 yield = (exchangeRate > oldRate) ? exchangeRate - oldRate : 0;
        emit YieldAccrued(yield);
        return yield;
    }

    /// @notice Get total value locked in underlying terms
    function totalValue() external view override returns (uint256) {
        uint256 totalShares = _yieldToken.totalSupply();
        return totalShares.wmul(_getCurrentExchangeRate());
    }

    /// @notice Set the APY (admin only)
    function setAPY(uint256 apy_) external onlyAdmin {
        _updateExchangeRate();
        uint256 oldAPY = apy;
        apy = apy_;
        emit APYUpdated(oldAPY, apy_);
    }

    /// @notice Poke yield - manually trigger yield accrual
    function pokeYield() external {
        _updateExchangeRate();
    }

    // Internal functions

    function _getCurrentExchangeRate() internal view returns (uint256) {
        if (_yieldToken.totalSupply() == 0) {
            return exchangeRate;
        }

        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        if (timeElapsed == 0) {
            return exchangeRate;
        }

        // Calculate yield: rate = rate * (1 + apy)^(timeElapsed / 1 year)
        // Using compound interest formula
        uint256 periodsPerYear = 365 days;
        uint256 ratePerPeriod = FixedPointMath.WAD + (apy * timeElapsed) / periodsPerYear;
        
        return exchangeRate.wmul(ratePerPeriod);
    }

    function _updateExchangeRate() internal {
        exchangeRate = _getCurrentExchangeRate();
        lastUpdateTime = block.timestamp;
    }
}

