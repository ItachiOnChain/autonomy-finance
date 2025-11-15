// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./ERC20.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/IERC20Burnable.sol";
import "../base/Errors.sol";

/// @notice Mintable and Burnable ERC20 token
contract MintableBurnableERC20 is ERC20, IERC20Mintable, IERC20Burnable {
    address public minter;

    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    /// @param name_ token name
    /// @param symbol_ token symbol
    /// @param decimals_ token decimals
    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_, decimals_) {
        minter = msg.sender;
    }

    // Wrapped modifier logic to reduce code size (forge-lint suggestion)
    modifier onlyMinter() {
        _onlyMinter();
        _;
    }

    function _onlyMinter() internal view {
        if (msg.sender != minter) revert Errors.Unauthorized();
    }

    /// @notice Mint `amount` tokens to `to`
    /// @dev Restricted to `minter`
    function mint(address to, uint256 amount) external override onlyMinter {
        _mint(to, amount);
    }

    /// @notice Change the minter
    /// @dev Only current minter can call. Setting to address(0) will renounce minter role.
    function setMinter(address newMinter) external onlyMinter {
        address oldMinter = minter;
        minter = newMinter;
        emit MinterUpdated(oldMinter, newMinter);
    }

    /// @notice Renounce the minter role (set to zero). Useful for tests or when minting should be permanently disabled.
    /// @dev Only callable by current minter.
    function renounceMinter() external onlyMinter {
        address oldMinter = minter;
        minter = address(0);
        emit MinterUpdated(oldMinter, address(0));
    }

    /// @notice Burn `amount` tokens from caller
    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }

    /// @notice Burn `amount` tokens from `from` using allowance
    function burnFrom(address from, uint256 amount) external override {
        uint256 currentAllowance = allowance(from, msg.sender);
        if (currentAllowance < amount) revert Errors.InsufficientAllowance();
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
    }
}
