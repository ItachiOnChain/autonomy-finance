// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IERC20Minimal.sol";

/// @notice Mintable ERC20 interface
interface IERC20Mintable is IERC20Minimal {
    function mint(address to, uint256 amount) external;
}

