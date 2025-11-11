// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./MintableERC20.sol";

/// @notice Mock collateral token for testing
/// @dev Can be minted by anyone for testing purposes
contract CollateralToken is MintableERC20 {
    constructor() MintableERC20("Test Collateral", "TCOL", 18) {}

    /// @notice Allow anyone to mint for testing
    function mintForTesting(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

