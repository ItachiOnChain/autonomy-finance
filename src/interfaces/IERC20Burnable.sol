// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IERC20Minimal.sol";

/// @notice Burnable ERC20 interface
interface IERC20Burnable is IERC20Minimal {
    function burn(uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

