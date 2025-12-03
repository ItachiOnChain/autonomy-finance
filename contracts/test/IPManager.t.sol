// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/IPManager.sol";
import "../src/AutonomyVault.sol";
import "../src/CollateralToken.sol";
import "../src/libraries/Errors.sol";

contract IPManagerTest is Test {
    IPManager public ipManager;
    AutonomyVault public vault;
    CollateralToken public token;
    
    address public user1 = address(0x1);
    address public mockIP1 = address(0x999);
    address public mockIP2 = address(0x888);
    
    function setUp() public {
        token = new CollateralToken();
        vault = new AutonomyVault(address(token));
        ipManager = new IPManager();
        
        vault.setIPManager(address(ipManager));
        ipManager.setVault(address(vault));
    }
    
    function testAcceptIP() public {
        ipManager.acceptIP(user1, mockIP1);
        
        address lockedIP = ipManager.getLockedIP(user1);
        assertEq(lockedIP, mockIP1);
        assertTrue(ipManager.isIPLocked(user1));
    }
    
    function testAcceptIPZeroAddressReverts() public {
        vm.expectRevert(Errors.ZeroAddress.selector);
        ipManager.acceptIP(user1, address(0));
    }
    
    function testAcceptIPAlreadyLockedReverts() public {
        ipManager.acceptIP(user1, mockIP1);
        
        vm.expectRevert(Errors.IPAlreadyLocked.selector);
        ipManager.acceptIP(user1, mockIP2);
    }
    
    function testReturnIPWithNoDebt() public {
        // Setup: user deposits collateral and links IP
        token.mint(user1, 1000 ether);
        vm.startPrank(user1);
        token.approve(address(vault), type(uint256).max);
        vault.depositCollateral(1000 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        
        // Return IP (vault calls this when debt is zero)
        vm.prank(address(vault));
        ipManager.returnIP(user1);
        
        assertFalse(ipManager.isIPLocked(user1));
        assertEq(ipManager.getLockedIP(user1), address(0));
    }
    
    function testReturnIPWithDebtReverts() public {
        // Setup: user deposits, borrows, and links IP
        token.mint(user1, 1000 ether);
        token.mint(address(vault), 10000 ether);
        
        vm.startPrank(user1);
        token.approve(address(vault), type(uint256).max);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        
        // Try to return IP with outstanding debt
        vm.prank(address(vault));
        vm.expectRevert(Errors.DebtNotZero.selector);
        ipManager.returnIP(user1);
    }
    
    function testReturnIPUnauthorizedReverts() public {
        ipManager.acceptIP(user1, mockIP1);
        
        vm.prank(user1);
        vm.expectRevert(Errors.UnauthorizedCaller.selector);
        ipManager.returnIP(user1);
    }
    
    function testReturnIPNotLockedReverts() public {
        vm.prank(address(vault));
        vm.expectRevert(Errors.IPNotLocked.selector);
        ipManager.returnIP(user1);
    }
    
    function testDepositRoyalties() public {
        uint256 royaltyAmount = 100 ether;
        
        ipManager.depositRoyalties(mockIP1, royaltyAmount);
        
        uint256 balance = ipManager.getRoyaltyBalance(mockIP1);
        assertEq(balance, royaltyAmount);
    }
    
    function testDepositRoyaltiesMultiple() public {
        ipManager.depositRoyalties(mockIP1, 100 ether);
        ipManager.depositRoyalties(mockIP1, 50 ether);
        
        uint256 balance = ipManager.getRoyaltyBalance(mockIP1);
        assertEq(balance, 150 ether);
    }
    
    function testDepositRoyaltiesZeroAmountReverts() public {
        vm.expectRevert(Errors.InvalidAmount.selector);
        ipManager.depositRoyalties(mockIP1, 0);
    }
    
    function testWithdrawRoyalties() public {
        ipManager.depositRoyalties(mockIP1, 100 ether);
        
        uint256 withdrawn = ipManager.withdrawRoyalties(mockIP1, 60 ether);
        
        assertEq(withdrawn, 60 ether);
        assertEq(ipManager.getRoyaltyBalance(mockIP1), 40 ether);
    }
    
    function testWithdrawRoyaltiesExceedsBalance() public {
        ipManager.depositRoyalties(mockIP1, 100 ether);
        
        uint256 withdrawn = ipManager.withdrawRoyalties(mockIP1, 150 ether);
        
        // Should only withdraw available amount
        assertEq(withdrawn, 100 ether);
        assertEq(ipManager.getRoyaltyBalance(mockIP1), 0);
    }
    
    function testWithdrawRoyaltiesUnauthorizedReverts() public {
        ipManager.depositRoyalties(mockIP1, 100 ether);
        
        vm.prank(user1);
        vm.expectRevert(Errors.UnauthorizedCaller.selector);
        ipManager.withdrawRoyalties(mockIP1, 50 ether);
    }
}
