// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";

contract WBTC is MockERC20 {
    constructor() MockERC20("Wrapped Bitcoin", "WBTC", 8) {}
}
