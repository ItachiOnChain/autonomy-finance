// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./ERC20.sol";
import "../interfaces/IERC20Burnable.sol";
import "../base/Errors.sol";

/// @notice Burnable ERC20 token
contract BurnableERC20 is ERC20, IERC20Burnable {
    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_, decimals_) { }

    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external override {
        uint256 currentAllowance = allowance(from, msg.sender);
        if (currentAllowance < amount) revert Errors.InsufficientAllowance();
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
    }
}

