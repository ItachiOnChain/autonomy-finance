// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AutonomyVault.sol";
import "../src/CollateralToken.sol";
import "../src/IPManager.sol";
import "../src/libraries/Errors.sol";

contract AutonomyVaultTest is Test {
    AutonomyVault public vault;
    CollateralToken public token;
    IPManager public ipManager;
    
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    
    uint256 constant INITIAL_BALANCE = 10000 ether;
    
    function setUp() public {
        // Deploy contracts
        token = new CollateralToken();
        vault = new AutonomyVault(address(token));
        ipManager = new IPManager();
        
        // Wire contracts
        vault.setIPManager(address(ipManager));
        ipManager.setVault(address(vault));
        
        // Mint tokens to users
        token.mint(user1, INITIAL_BALANCE);
        token.mint(user2, INITIAL_BALANCE);
        
        // Approve vault
        vm.prank(user1);
        token.approve(address(vault), type(uint256).max);
        
        vm.prank(user2);
        token.approve(address(vault), type(uint256).max);
    }
    
    function testDepositCollateral() public {
        uint256 depositAmount = 1000 ether;
        
        vm.prank(user1);
        vault.depositCollateral(depositAmount);
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.collateralAmount, depositAmount);
        assertEq(position.debtAmount, 0);
    }
    
    function testDepositZeroReverts() public {
        vm.prank(user1);
        vm.expectRevert(Errors.InvalidAmount.selector);
        vault.depositCollateral(0);
    }
    
    function testWithdrawCollateral() public {
        uint256 depositAmount = 1000 ether;
        uint256 withdrawAmount = 500 ether;
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        vault.withdrawCollateral(withdrawAmount);
        vm.stopPrank();
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.collateralAmount, depositAmount - withdrawAmount);
    }
    
    function testWithdrawExceedsBalanceReverts() public {
        uint256 depositAmount = 1000 ether;
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        
        vm.expectRevert(Errors.InsufficientBalance.selector);
        vault.withdrawCollateral(depositAmount + 1);
        vm.stopPrank();
    }
    
    function testBorrow() public {
        uint256 depositAmount = 1000 ether;
        uint256 borrowAmount = 500 ether; // 50% LTV
        
        // Fund vault for borrowing
        token.mint(address(vault), 10000 ether);
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        vault.borrow(borrowAmount);
        vm.stopPrank();
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.debtAmount, borrowAmount);
    }
    
    function testBorrowExceedsLTVReverts() public {
        uint256 depositAmount = 1000 ether;
        uint256 borrowAmount = 800 ether; // 80% LTV (exceeds 75% max)
        
        // Fund vault for borrowing
        token.mint(address(vault), 10000 ether);
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        
        vm.expectRevert(Errors.ExceedsMaxLTV.selector);
        vault.borrow(borrowAmount);
        vm.stopPrank();
    }
    
    function testRepay() public {
        uint256 depositAmount = 1000 ether;
        uint256 borrowAmount = 500 ether;
        uint256 repayAmount = 200 ether;
        
        // Fund vault for borrowing
        token.mint(address(vault), 10000 ether);
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        vault.borrow(borrowAmount);
        vault.repay(repayAmount);
        vm.stopPrank();
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.debtAmount, borrowAmount - repayAmount);
    }
    
    function testRepayFullDebt() public {
        uint256 depositAmount = 1000 ether;
        uint256 borrowAmount = 500 ether;
        
        // Fund vault for borrowing
        token.mint(address(vault), 10000 ether);
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        vault.borrow(borrowAmount);
        vault.repay(borrowAmount);
        vm.stopPrank();
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.debtAmount, 0);
    }
    
    function testRepayWithNoDebtReverts() public {
        vm.prank(user1);
        vm.expectRevert(Errors.NoDebt.selector);
        vault.repay(100 ether);
    }
    
    function testGetMaxBorrowAmount() public {
        uint256 depositAmount = 1000 ether;
        
        vm.prank(user1);
        vault.depositCollateral(depositAmount);
        
        uint256 maxBorrow = vault.getMaxBorrowAmount(user1);
        assertEq(maxBorrow, (depositAmount * 7500) / 10000); // 75% LTV
    }
    
    function testWithdrawViolatingLTVReverts() public {
        uint256 depositAmount = 1000 ether;
        uint256 borrowAmount = 700 ether; // 70% LTV
        
        // Fund vault for borrowing
        token.mint(address(vault), 10000 ether);
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        vault.borrow(borrowAmount);
        
        // Try to withdraw 500 ether, leaving 500 ether collateral
        // This would make LTV = 700/500 = 140% which exceeds max
        vm.expectRevert(Errors.ExceedsMaxLTV.selector);
        vault.withdrawCollateral(500 ether);
        vm.stopPrank();
    }
    
    function testLinkIP() public {
        address mockIP = address(0x999);
        
        vm.prank(address(ipManager));
        vault.linkIP(user1, mockIP);
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertTrue(position.hasIP);
        assertEq(position.ipAsset, mockIP);
    }
    
    function testLinkIPUnauthorizedReverts() public {
        address mockIP = address(0x999);
        
        vm.prank(user1);
        vm.expectRevert(Errors.UnauthorizedCaller.selector);
        vault.linkIP(user1, mockIP);
    }
    
    function testReduceDebt() public {
        uint256 depositAmount = 1000 ether;
        uint256 borrowAmount = 500 ether;
        uint256 reductionAmount = 200 ether;
        
        // Fund vault for borrowing
        token.mint(address(vault), 10000 ether);
        
        vm.startPrank(user1);
        vault.depositCollateral(depositAmount);
        vault.borrow(borrowAmount);
        vm.stopPrank();
        
        // Reduce debt as owner
        vault.reduceDebt(user1, reductionAmount);
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.debtAmount, borrowAmount - reductionAmount);
    }
}
