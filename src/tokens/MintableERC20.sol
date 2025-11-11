// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./ERC20.sol";
import "../interfaces/IERC20Mintable.sol";
import "../base/Errors.sol";

/// @notice Mintable ERC20 token
contract MintableERC20 is ERC20, IERC20Mintable {
    address public minter;

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_, decimals_) {
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
}

