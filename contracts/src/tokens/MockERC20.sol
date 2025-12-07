// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Base ERC20 token for testing with mint functionality
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens to an address
     * @param to Address to mint to
     * @param amount Amount to mint (in token decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Public mint function for testing (anyone can mint)
     * @param amount Amount to mint to caller
     * @dev Only works on local/testnet (chainId 31337)
     */
    function publicMint(uint256 amount) external {
        require(block.chainid == 31337, "Mint only allowed on testnet");
        _mint(msg.sender, amount);
    }
}
