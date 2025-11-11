// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./Errors.sol";

/// @notice Safe casting utilities
library SafeCast {
    function toUint128(uint256 x) internal pure returns (uint128) {
        if (x > type(uint128).max) revert Errors.Overflow();
        return uint128(x);
    }

    function toUint64(uint256 x) internal pure returns (uint64) {
        if (x > type(uint64).max) revert Errors.Overflow();
        return uint64(x);
    }

    function toUint32(uint256 x) internal pure returns (uint32) {
        if (x > type(uint32).max) revert Errors.Overflow();
        return uint32(x);
    }

    function toInt256(uint256 x) internal pure returns (int256) {
        if (x > uint256(type(int256).max)) revert Errors.Overflow();
        return int256(x);
    }

    function toInt128(int256 x) internal pure returns (int128) {
        if (x > type(int128).max || x < type(int128).min) revert Errors.Overflow();
        return int128(x);
    }
}

