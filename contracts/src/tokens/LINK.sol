// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";

contract LINK is MockERC20 {
    constructor() MockERC20("Chainlink", "LINK", 18) {}
}
