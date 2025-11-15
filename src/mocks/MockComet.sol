// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Mock Comet contract for local testing
/// @dev Simulates a Comet-like contract where yield accrues by increasing totalSupply
///     (so adapters that compute yield from totalSupply deltas will detect it).
contract MockComet is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    uint256 public exchangeRate; // WAD format (1e18 = 1:1) used for supply/withdraw arithmetic
    uint256 public lastAccrueTime;
    uint256 public supplyAPY; // Annual yield in WAD (e.g., 0.04e18 = 4%)

    event Supplied(address indexed account, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed account, uint256 amount, uint256 sharesBurned);
    event YieldAccrued(uint256 deltaShares, uint256 newTotalSupply);

    constructor(address asset_, string memory name_, string memory symbol_, uint256 initialAPY_) ERC20(name_, symbol_) {
        require(asset_ != address(0), "MockComet: zero asset");
        asset = IERC20(asset_);
        exchangeRate = 1e18; // Start at 1:1 for simplicity
        lastAccrueTime = block.timestamp;
        supplyAPY = initialAPY_;
    }

    /// @notice Supply assets and mint cmETH shares
    /// @dev shares = amount / exchangeRate (WAD math)
    function supply(address asset_, uint256 amount) external {
        require(asset_ == address(asset), "MockComet: wrong asset");
        require(amount > 0, "MockComet: zero amount");

        // Accrue interest before supply (this may mint delta shares to totalSupply)
        _accrue();

        // Pull underlying from caller
        asset.safeTransferFrom(msg.sender, address(this), amount);

        // Mint shares at current exchange rate (shares = amount / exchangeRate)
        // share = (amount * 1e18) / exchangeRate
        uint256 shares = (amount * 1e18) / exchangeRate;
        _mint(msg.sender, shares);

        emit Supplied(msg.sender, amount, shares);
    }

    /// @notice Withdraw assets by burning cmETH shares
    /// @dev burns shares = amount / exchangeRate; sends underlying to caller
    function withdraw(address asset_, uint256 amount) external {
        require(asset_ == address(asset), "MockComet: wrong asset");
        require(amount > 0, "MockComet: zero amount");

        // Accrue interest before withdrawal
        _accrue();

        // Calculate shares to burn
        uint256 shares = (amount * 1e18) / exchangeRate;
        _burn(msg.sender, shares);

        // Transfer assets to user
        asset.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, shares);
    }

    /// @notice Accrue yield by minting new shares (increases totalSupply).
    /// @dev This simulates protocol-level yield distribution so adapters that look at
    ///      `totalSupply()` increases will detect yield correctly.
    function _accrue() internal {
        uint256 timeElapsed = block.timestamp - lastAccrueTime;
        if (timeElapsed == 0) return;

        // seconds per year
        uint256 secondsPerYear = 365 days;

        uint256 currentTotal = totalSupply();

        // If no shares exist yet, nothing to distribute
        if (currentTotal == 0) {
            lastAccrueTime = block.timestamp;
            return;
        }

        // deltaShares = currentTotal * supplyAPY * timeElapsed / secondsPerYear / 1e18
        // supplyAPY is WAD (1e18 = 100%), so divide by 1e18 to normalize.
        uint256 deltaShares = (currentTotal * supplyAPY * timeElapsed) / (secondsPerYear * 1e18);

        if (deltaShares > 0) {
            // Mint the yield shares to the contract itself (these represent protocol-accrued yield).
            // They don't belong to any user directly; adapters can treat totalSupply growth as yield.
            _mint(address(this), deltaShares);

            emit YieldAccrued(deltaShares, totalSupply());
        }

        lastAccrueTime = block.timestamp;
    }

    /// @notice Get current (mock) exchange rate — for convenience
    function getExchangeRate() external view returns (uint256) {
        return exchangeRate;
    }

    /// @notice Set APY (for testing)
    function setAPY(uint256 newAPY) external {
        _accrue();
        supplyAPY = newAPY;
    }

    /// @notice Force accrue (for testing)
    function accrue() external {
        _accrue();
    }
}
