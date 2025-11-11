// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/// @notice Price oracle interface for Autonomy V1
/// @dev Returns price of token in debt token units (1e18 = parity)
interface IPriceOracle {
    /// @notice Get price of token in debt token units
    /// @param token The token address to get price for
    /// @return price Price in debt token units (1e18 = 1:1 parity)
    function priceInDebt(address token) external view returns (uint256);
}

