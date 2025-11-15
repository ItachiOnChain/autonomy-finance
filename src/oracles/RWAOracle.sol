// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../base/Errors.sol";

/// @notice RWA Oracle for NAV-based pricing
/// @dev Manages NAV per share with staleness and jump guards
contract RWAOracle is Ownable {
    uint256 public navPerShare; // 1e18
    uint64 public lastUpdate;
    uint64 public validUntil;
    uint256 public maxDailyChangeBps; // e.g., 150 = 1.5%

    event NAVUpdated(uint256 nav, uint64 validUntil);

    constructor(address initialOwner, uint256 initialNAV, uint256 maxChangeBps) Ownable(initialOwner) {
        navPerShare = initialNAV;
        maxDailyChangeBps = maxChangeBps;
        lastUpdate = uint64(block.timestamp);
        validUntil = uint64(block.timestamp + 1 days);
    }

    /// @notice Update NAV per share
    /// @param nav New NAV per share (1e18)
    /// @param _validUntil Timestamp until which this NAV is valid
    function updateNAV(uint256 nav, uint64 _validUntil) external onlyOwner {
        // Enforce staleness
        require(_validUntil >= block.timestamp, "stale");

        uint256 old = navPerShare;
        if (old != 0) {
            // Enforce jump guard
            uint256 diff = old > nav ? old - nav : nav - old;
            require(diff * 10_000 / old <= maxDailyChangeBps, "jump");
        }

        navPerShare = nav;
        lastUpdate = uint64(block.timestamp);
        validUntil = _validUntil;
        emit NAVUpdated(nav, _validUntil);
    }

    /// @notice Check if NAV is stale
    /// @return True if NAV is stale
    function isStale() external view returns (bool) {
        return block.timestamp > validUntil;
    }

    /// @notice Get current NAV per share
    /// @return NAV per share (1e18)
    function getNAV() external view returns (uint256) {
        require(block.timestamp <= validUntil, "stale");
        return navPerShare;
    }
}

