// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./ERC20.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/IERC20Burnable.sol";
import "../base/Errors.sol";

/// @notice AtAsset token - the debt token that represents self-repaying loans
/// @dev Combines mintable and burnable functionality
contract AtAsset is ERC20, IERC20Mintable, IERC20Burnable {
    address public minter;

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_, decimals_) {
        minter = msg.sender;
    }

    modifier onlyMinter() {
        if (msg.sender != minter) revert Errors.Unauthorized();
        _;
    }

    function mint(address to, uint256 amount) external override onlyMinter {
        _mint(to, amount);
    }

    function setMinter(address newMinter) external onlyMinter {
        address oldMinter = minter;
        minter = newMinter;
        emit MinterUpdated(oldMinter, newMinter);
    }

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

