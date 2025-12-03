// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInterestRateModel
 * @notice Interface for interest rate calculation
 */
interface IInterestRateModel {
    /**
     * @notice Calculate the current borrow rate
     * @param utilizationRate The utilization rate (in basis points, 10000 = 100%)
     * @return The borrow rate per second (in basis points)
     */
    function getBorrowRate(uint256 utilizationRate) external view returns (uint256);

    /**
     * @notice Calculate the current supply rate
     * @param utilizationRate The utilization rate (in basis points)
     * @param borrowRate The borrow rate (in basis points)
     * @return The supply rate per second (in basis points)
     */
    function getSupplyRate(uint256 utilizationRate, uint256 borrowRate) external view returns (uint256);
}
