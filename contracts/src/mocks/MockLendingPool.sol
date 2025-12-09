// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockLendingPool {
    mapping(address => uint256) public debts;

    event DebtRepaid(address indexed borrower, uint256 amount, address token);
    event DebtSet(address indexed borrower, uint256 amount);

    function setDebt(address borrower, uint256 amount) external {
        debts[borrower] = amount;
        emit DebtSet(borrower, amount);
    }

    function getDebt(address borrower) external view returns (uint256) {
        return debts[borrower];
    }

    function repayWithToken(
        address borrower,
        address token,
        uint256 amount
    ) external {
        require(token != address(0), "Invalid token");
        // In a real pool, verify token and price
        // For mock, we just assume 1 token = 1 unit of debt for simplicity,
        // or we could use the amount directly.

        uint256 currentDebt = debts[borrower];
        uint256 repayAmount = amount > currentDebt ? currentDebt : amount;

        debts[borrower] -= repayAmount;

        // Transfer tokens from sender (AutoRepayVault) to here
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        emit DebtRepaid(borrower, repayAmount, token);
    }
}
