// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAutoRepayEngine {
    struct RepaymentSimulation {
        uint256 royaltiesAvailable;
        uint256 currentDebt;
        uint256 repaymentAmount;
        uint256 remainingDebt;
        bool willReleaseIP;
    }
    
    event AutoRepayExecuted(address indexed user, uint256 amount, uint256 remainingDebt);
    event IPReleased(address indexed user, address indexed ipAsset);
    
    function simulateAutoRepay(address user) external view returns (RepaymentSimulation memory);
    function executeAutoRepay(address user) external returns (uint256 repaidAmount);
}
