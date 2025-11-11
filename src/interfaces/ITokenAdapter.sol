// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IERC20Minimal.sol";

/// @notice Interface for yield token adapters
interface ITokenAdapter {
    /// @notice The underlying token this adapter wraps
    function underlyingToken() external view returns (IERC20Minimal);

    /// @notice The yield token this adapter manages
    function yieldToken() external view returns (IERC20Minimal);

    /// @notice Get the current exchange rate (yield token / underlying token)
    function getExchangeRate() external view returns (uint256);

    /// @notice Deposit underlying tokens and receive yield tokens
    function deposit(uint256 amount, address recipient) external returns (uint256);

    /// @notice Withdraw underlying tokens by burning yield tokens
    function withdraw(uint256 amount, address recipient) external returns (uint256);

    /// @notice Harvest yield and update exchange rate
    function harvest() external returns (uint256);

    /// @notice Accrue yield (update exchange rate/index)
    /// @dev Called before state-changing operations to prevent stale index manipulation
    function accrue() external;

    /// @notice Get the total value locked in underlying terms
    function totalValue() external view returns (uint256);
}

