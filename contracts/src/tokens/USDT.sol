// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";

contract USDT is MockERC20 {
    constructor() MockERC20("Tether USD", "USDT", 6) {}
}
