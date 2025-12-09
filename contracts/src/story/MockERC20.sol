// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MockERC20
 * @notice Mintable ERC20 token for simulating royalty payments in demo/testnet
 * @dev Uses AccessControl for minter role management
 */
contract MockERC20 is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Emitted when minter role is granted
    event MinterGranted(address indexed account);

    /// @notice Emitted when minter role is revoked
    event MinterRevoked(address indexed account);

    /**
     * @notice Constructor initializes the token with name and symbol
     * @param initialMinter Address to receive initial minter role
     */
    constructor(address initialMinter) ERC20("Mock Royalty Token", "MRT") {
        require(initialMinter != address(0), "Invalid minter address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, initialMinter);

        emit MinterGranted(initialMinter);
    }

    /**
     * @notice Mint tokens to a specified address
     * @dev Only callable by addresses with MINTER_ROLE
     * @param to Address to receive minted tokens
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");

        _mint(to, amount);
    }

    /**
     * @notice Grant minter role to an address
     * @dev Only callable by admin
     * @param account Address to grant minter role
     */
    function grantMinterRole(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid account address");
        grantRole(MINTER_ROLE, account);
        emit MinterGranted(account);
    }

    /**
     * @notice Revoke minter role from an address
     * @dev Only callable by admin
     * @param account Address to revoke minter role from
     */
    function revokeMinterRole(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
        emit MinterRevoked(account);
    }

    /**
     * @notice Check if an address has minter role
     * @param account Address to check
     * @return bool True if address has minter role
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }
}
