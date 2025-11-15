// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./Errors.sol";

/// @notice Fixed point math library for precise calculations
library FixedPointMath {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant RAY = 1e27;
    uint256 internal constant RAD = 1e45;

    /// @notice Multiply two WAD numbers
    function wmul(uint256 x, uint256 y) internal pure returns (uint256) {
        return (x * y) / WAD;
    }

    /// @notice Divide two WAD numbers
    function wdiv(uint256 x, uint256 y) internal pure returns (uint256) {
        if (y == 0) revert Errors.DivisionByZero();
        return (x * WAD) / y;
    }

    /// @notice Multiply two RAY numbers
    function rmul(uint256 x, uint256 y) internal pure returns (uint256) {
        return (x * y) / RAY;
    }

    /// @notice Divide two RAY numbers
    function rdiv(uint256 x, uint256 y) internal pure returns (uint256) {
        if (y == 0) revert Errors.DivisionByZero();
        return (x * RAY) / y;
    }

    /// @notice Calculate x to the power of y
    function rpow(uint256 x, uint256 n) internal pure returns (uint256) {
        uint256 result = RAY;
        while (n > 0) {
            if (n % 2 == 1) {
                result = rmul(result, x);
            }
            x = rmul(x, x);
            n /= 2;
        }
        return result;
    }

    /// @notice Calculate compound interest
    function compound(uint256 principal, uint256 rate, uint256 time) internal pure returns (uint256) {
        return rmul(principal, rpow(rate, time));
    }
}

