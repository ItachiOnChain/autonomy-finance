// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";

contract AAVE is MockERC20 {
    constructor() MockERC20("Aave Token", "AAVE", 18) {}
}
