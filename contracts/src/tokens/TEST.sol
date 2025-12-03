// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";

contract TEST is MockERC20 {
    constructor() MockERC20("Test Token", "TEST", 18) {}
}
