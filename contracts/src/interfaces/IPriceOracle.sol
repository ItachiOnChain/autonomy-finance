// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPriceOracle
 * @notice Interface for price oracle
 */
interface IPriceOracle {
    /**
     * @notice Get the price of an asset in USD (18 decimals)
     * @param asset The address of the asset
     * @return The price in USD with 18 decimals
     */
    function getPrice(address asset) external view returns (uint256);

    /**
     * @notice Set the price of an asset (admin only)
     * @param asset The address of the asset
     * @param price The price in USD with 18 decimals
     */
    function setPrice(address asset, uint256 price) external;
}
