// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAutonomyVault {
    struct Position {
        uint256 collateralAmount;
        uint256 debtAmount;
        address ipAsset;
        bool hasIP;
    }
    
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event DebtReduced(address indexed user, uint256 amount, uint256 remainingDebt);
    
    function depositCollateral(uint256 amount) external;
    function withdrawCollateral(uint256 amount) external;
    function borrow(uint256 amount) external;
    function repay(uint256 amount) external;
    function reduceDebt(address user, uint256 amount) external;
    function linkIP(address user, address ipAsset) external;
    function getPosition(address user) external view returns (Position memory);
    function getMaxBorrowAmount(address user) external view returns (uint256);
}
