// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Whitelist for compliance
contract Whitelist is Ownable {
    mapping(address => bool) public isWhitelisted;

    event Set(address indexed user, bool allowed);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Set whitelist status for a user
    /// @param user User address
    /// @param allowed Whether user is whitelisted
    function set(address user, bool allowed) external onlyOwner {
        isWhitelisted[user] = allowed;
        emit Set(user, allowed);
    }
}

