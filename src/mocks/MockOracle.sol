// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPriceOracle.sol";

/// @notice Mock price oracle for testing
/// @dev Returns configurable price; default 1e18 (parity)
contract MockOracle is IPriceOracle, Ownable {
    mapping(address => uint256) public price; // token -> price in debt units, 1e18

    event PriceSet(address indexed token, uint256 price);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Set price for a token
    /// @param token Token address
    /// @param p Price in debt token units (1e18 = parity)
    function setPrice(address token, uint256 p) external onlyOwner {
        price[token] = p;
        emit PriceSet(token, p);
    }

    /// @notice Get price of token in debt token units
    /// @param token Token address
    /// @return Price in debt token units (1e18 = parity), defaults to 1e18 if not set
    function priceInDebt(address token) external view override returns (uint256) {
        uint256 p = price[token];
        return p == 0 ? 1e18 : p;
    }
}

