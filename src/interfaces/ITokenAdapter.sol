// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IERC20Minimal.sol";

/// @notice Interface for yield token adapters
interface ITokenAdapter {
    /// @notice The underlying token this adapter wraps (e.g., USDC)
    function underlyingToken() external view returns (IERC20Minimal);

    /// @notice The yield token this adapter manages (adapter's share token)
    function yieldToken() external view returns (IERC20Minimal);

    /// @notice Get the current exchange rate (yield token / underlying token)
    /// @dev Exchange rate is expressed as a WAD (1e18 = 1:1)
    function getExchangeRate() external view returns (uint256);

    /// @notice Deposit underlying tokens and receive yield tokens (shares)
    /// @param amount Amount of underlying to deposit (in underlying token decimals)
    /// @param recipient Address which will receive the minted shares
    /// @return shares Number of yield-token shares minted to recipient
    function deposit(uint256 amount, address recipient) external returns (uint256);

    /// @notice Withdraw underlying tokens by burning yield-token shares
    /// @param shares Number of yield-token shares to burn
    /// @param recipient Address which will receive the underlying assets
    /// @return amount Amount of underlying tokens transferred to recipient
    function withdraw(uint256 shares, address recipient) external returns (uint256);

    /// @notice Harvest yield and update exchange rate; returns harvested yield (adapter-specific units)
    function harvest() external returns (uint256);

    /// @notice Accrue yield / update internal indices (called by core before state changes)
    function accrue() external;

    /// @notice Get the total value managed by the adapter expressed in underlying token units
    function totalValue() external view returns (uint256);
}
