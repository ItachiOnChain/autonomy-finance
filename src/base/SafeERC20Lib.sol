// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IERC20Minimal.sol";
import "./Errors.sol";

/// @notice Safe ERC20 operations (custom minimal version)
/// @dev Renamed to SafeERC20Lib to avoid collision with OZ SafeERC20
library SafeERC20Lib {
    function safeTransfer(IERC20Minimal token, address to, uint256 amount) internal {
        (bool success, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount));
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert Errors.InvalidTransfer();
        }
    }

    function safeTransferFrom(IERC20Minimal token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount));
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert Errors.InvalidTransfer();
        }
    }

    function safeApprove(IERC20Minimal token, address spender, uint256 amount) internal {
        (bool success, bytes memory data) =
            address(token).call(abi.encodeWithSelector(IERC20Minimal.approve.selector, spender, amount));
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert Errors.InvalidApproval();
        }
    }
}
