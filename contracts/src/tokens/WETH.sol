// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";

contract WETH is MockERC20 {
    constructor() MockERC20("Wrapped Ether", "WETH", 18) {}
}
