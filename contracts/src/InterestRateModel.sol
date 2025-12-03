// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IInterestRateModel.sol";

/**
 * @title InterestRateModel
 * @notice Kink-based interest rate model
 * @dev Uses a two-slope model: low rate below kink, high rate above kink
 */
contract InterestRateModel is IInterestRateModel {
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant BASIS_POINTS = 10000;

    // Model parameters (in basis points)
    uint256 public immutable baseRatePerYear; // Base rate at 0% utilization
    uint256 public immutable multiplierPerYear; // Rate increase per utilization point (before kink)
    uint256 public immutable jumpMultiplierPerYear; // Rate increase per utilization point (after kink)
    uint256 public immutable kink; // Utilization point where rate jumps (in basis points)
    uint256 public immutable reserveFactor; // Percentage of interest going to reserves

    constructor(
        uint256 _baseRatePerYear,
        uint256 _multiplierPerYear,
        uint256 _jumpMultiplierPerYear,
        uint256 _kink,
        uint256 _reserveFactor
    ) {
        baseRatePerYear = _baseRatePerYear;
        multiplierPerYear = _multiplierPerYear;
        jumpMultiplierPerYear = _jumpMultiplierPerYear;
        kink = _kink;
        reserveFactor = _reserveFactor;
    }

    /**
     * @notice Calculate the current borrow rate
     * @param utilizationRate The utilization rate (in basis points, 10000 = 100%)
     * @return The borrow rate per year (in basis points)
     */
    function getBorrowRate(uint256 utilizationRate) external view override returns (uint256) {
        if (utilizationRate <= kink) {
            // Below kink: baseRate + (utilization * multiplier)
            return baseRatePerYear + (utilizationRate * multiplierPerYear) / BASIS_POINTS;
        } else {
            // Above kink: baseRate + (kink * multiplier) + (excess * jumpMultiplier)
            uint256 normalRate = baseRatePerYear + (kink * multiplierPerYear) / BASIS_POINTS;
            uint256 excessUtil = utilizationRate - kink;
            return normalRate + (excessUtil * jumpMultiplierPerYear) / BASIS_POINTS;
        }
    }

    /**
     * @notice Calculate the current supply rate
     * @param utilizationRate The utilization rate (in basis points)
     * @param borrowRate The borrow rate (in basis points)
     * @return The supply rate per year (in basis points)
     */
    function getSupplyRate(
        uint256 utilizationRate,
        uint256 borrowRate
    ) external view override returns (uint256) {
        // Supply rate = borrow rate * utilization * (1 - reserve factor)
        uint256 rateToPool = (borrowRate * (BASIS_POINTS - reserveFactor)) / BASIS_POINTS;
        return (utilizationRate * rateToPool) / BASIS_POINTS;
    }

    /**
     * @notice Get APY from APR (for display purposes)
     * @param ratePerYear Annual rate in basis points
     * @return APY in basis points
     */
    function getAPY(uint256 ratePerYear) external pure returns (uint256) {
        // Simple conversion for display (actual compounding would be more complex)
        return ratePerYear;
    }
}
