// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NonStandardUSDT
 * @dev Mock USDT that does NOT return a boolean on transfer/transferFrom/approve.
 *      This mimics the behavior of USDT on Ethereum mainnet.
 */
contract NonStandardUSDT is Ownable {
    string public name = "Tether USD";
    string public symbol = "USDT";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor() Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    // Non-standard: No return value
    function transfer(address to, uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }

    // Non-standard: No return value
    function transferFrom(address from, address to, uint256 amount) public {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance"
        );

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }

    // Non-standard: No return value
    // Also mimics USDT's race condition protection (revert if changing from non-zero to non-zero)
    // though SafeERC20 handles this via forceApprove
    function approve(address spender, uint256 amount) public {
        allowance[msg.sender][spender] = amount;
    }
}
