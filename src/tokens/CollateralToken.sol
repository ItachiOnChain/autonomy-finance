// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./MintableBurnableERC20.sol";

/// @notice Mock collateral token for testing
/// @dev Can be minted by anyone for testing purposes
contract CollateralToken is MintableBurnableERC20 {
    constructor() MintableBurnableERC20("Test Collateral", "TCOL", 18) { }

    /// @notice Allow anyone to mint for testing
    /// @dev This bypasses the minter role intentionally for local tests.
    function mintForTesting(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
