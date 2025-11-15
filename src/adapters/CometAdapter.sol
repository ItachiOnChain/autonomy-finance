// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITokenAdapter.sol";
import "../interfaces/IERC20Minimal.sol";
import "../base/FixedPointMath.sol";
import "../base/Errors.sol";
import "../base/SafeERC20Lib.sol";

interface IComet {
    function supply(address asset, uint256 amount) external;
    function withdraw(address asset, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/// @notice Comet adapter that wraps a Comet-like contract as a yield adapter
/// @dev Uses local SafeERC20Lib and IERC20Minimal for safe token operations
contract CometAdapter is ITokenAdapter, ReentrancyGuard, Ownable {
    using FixedPointMath for uint256;
    using SafeERC20Lib for IERC20Minimal;

    IERC20Minimal public immutable underlyingToken;
    IComet public immutable comet;
    
    uint256 public lastAccrueTime;
    uint256 public lastTotalSupply;

    event YieldHarvested(uint256 yield);

    /// @param initialOwner owner of this adapter (for emergencyWithdraw / admin)
    /// @param underlyingToken_ underlying ERC20 token address (e.g., USDC)
    /// @param comet_ comet protocol token/contract address
    constructor(
        address initialOwner,
        IERC20Minimal underlyingToken_,
        address comet_
    ) Ownable(initialOwner) {
        underlyingToken = underlyingToken_;
        comet = IComet(comet_);
        lastAccrueTime = block.timestamp;
        // safe to call totalSupply on comet at construction (tests expect this)
        lastTotalSupply = comet.totalSupply();
    }

    /// @notice Comet token is used as the yield token
    function yieldToken() external view override returns (IERC20Minimal) {
        return IERC20Minimal(address(comet));
    }

    /// @notice Exchange rate not modeled here (1:1 canonical for this adapter)
    function getExchangeRate() external view override returns (uint256) {
        return 1e18;
    }

    /// @notice Accrue hook (keeps a timestamp for bookkeeping)
    function accrue() external override {
        lastAccrueTime = block.timestamp;
    }

    /// @notice Deposit underlying, supply to Comet and transfer resulting shares to recipient.
    /// @dev Computes minted shares as postBalance - preBalance to avoid sending previously-held shares.
    ///      Works for both direct-user flows (caller supplies approval) and core-mediated flows
    ///      (Autonomy contract transfers underlying to itself and has approved this adapter).
    function deposit(uint256 amount, address recipient) external override nonReentrant returns (uint256) {
        if (amount == 0) revert Errors.InvalidAmount();

        // Pull underlying from caller (could be Autonomy or user)
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Approve comet: reset then set to minimise issues with non-standard tokens
        underlyingToken.safeApprove(address(comet), 0);
        underlyingToken.safeApprove(address(comet), amount);

        uint256 preCometBalance = comet.balanceOf(address(this));
        comet.supply(address(underlyingToken), amount);
        uint256 postCometBalance = comet.balanceOf(address(this));

        uint256 shares = 0;
        if (postCometBalance > preCometBalance) {
            shares = postCometBalance - preCometBalance;
            // Transfer only the newly minted shares to the recipient
            IERC20Minimal(address(comet)).safeTransfer(recipient, shares);
        }

        // Update bookkeeping
        lastTotalSupply = comet.totalSupply();
        lastAccrueTime = block.timestamp;

        return shares;
    }

    /// @notice Withdraw underlying by pulling comet shares from the caller (Autonomy/core),
    ///         calling comet.withdraw, and forwarding the resulting underlying delta to `recipient`.
    /// @dev For Autonomy custodial flow, Autonomy will be msg.sender and must have the comet shares.
    function withdraw(uint256 shares, address recipient) external override nonReentrant returns (uint256) {
        if (shares == 0) revert Errors.InvalidAmount();

        // Pull comet shares from the caller (msg.sender should be Autonomy/core)
        IERC20Minimal(address(comet)).safeTransferFrom(msg.sender, address(this), shares);

        // Record prior underlying balance to compute exact amount returned by comet.withdraw
        uint256 preUnderlyingBalance = IERC20Minimal(address(underlyingToken)).balanceOf(address(this));

        // Request withdraw from comet (comet will transfer underlying to this adapter)
        comet.withdraw(address(underlyingToken), shares);

        uint256 postUnderlyingBalance = IERC20Minimal(address(underlyingToken)).balanceOf(address(this));
        uint256 amountReceived = 0;
        if (postUnderlyingBalance > preUnderlyingBalance) {
            amountReceived = postUnderlyingBalance - preUnderlyingBalance;
            // Forward the underlying to the recipient
            IERC20Minimal(address(underlyingToken)).safeTransfer(recipient, amountReceived);
        }

        // Update bookkeeping
        lastTotalSupply = comet.totalSupply();
        lastAccrueTime = block.timestamp;

        return amountReceived;
    }

    /// @notice Harvest yield by checking increase in total supply (comet.totalSupply).
    /// @dev Emits YieldHarvested when positive.
    function harvest() external override nonReentrant returns (uint256) {
        uint256 currentSupply = comet.totalSupply();
        uint256 yieldEarned = 0;
        
        if (currentSupply > lastTotalSupply) {
            yieldEarned = currentSupply - lastTotalSupply;
        }
        
        lastTotalSupply = currentSupply;
        lastAccrueTime = block.timestamp;
        
        if (yieldEarned > 0) {
            emit YieldHarvested(yieldEarned);
        }
        
        return yieldEarned;
    }

    /// @notice Total value (in underlying-equivalent) exposed by this adapter
    function totalValue() external view override returns (uint256) {
        return comet.totalSupply();
    }

    /// @notice Emergency withdraw for admin
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20Minimal(token).safeTransfer(to, amount);
    }
}
