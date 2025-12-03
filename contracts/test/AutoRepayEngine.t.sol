// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AutoRepayEngine.sol";
import "../src/AutonomyVault.sol";
import "../src/IPManager.sol";
import "../src/CollateralToken.sol";
import "../src/libraries/Errors.sol";

contract AutoRepayEngineTest is Test {
    AutoRepayEngine public engine;
    AutonomyVault public vault;
    IPManager public ipManager;
    CollateralToken public token;
    
    address public user1 = address(0x1);
    address public mockIP1 = address(0x999);
    
    uint256 constant INITIAL_BALANCE = 10000 ether;
    
    function setUp() public {
        // Deploy contracts
        token = new CollateralToken();
        vault = new AutonomyVault(address(token));
        ipManager = new IPManager();
        engine = new AutoRepayEngine();
        
        // Wire contracts
        vault.setIPManager(address(ipManager));
        vault.setAutoRepayEngine(address(engine));
        ipManager.setVault(address(vault));
        ipManager.setAutoRepayEngine(address(engine));
        engine.setVault(address(vault));
        engine.setIPManager(address(ipManager));
        
        // Setup user
        token.mint(user1, INITIAL_BALANCE);
        token.mint(address(vault), INITIAL_BALANCE);
        
        vm.prank(user1);
        token.approve(address(vault), type(uint256).max);
    }
    
    function testSimulateAutoRepayNoDebt() public {
        IAutoRepayEngine.RepaymentSimulation memory sim = engine.simulateAutoRepay(user1);
        
        assertEq(sim.currentDebt, 0);
        assertEq(sim.royaltiesAvailable, 0);
        assertEq(sim.repaymentAmount, 0);
        assertEq(sim.remainingDebt, 0);
        assertFalse(sim.willReleaseIP);
    }
    
    function testSimulateAutoRepayWithDebtAndRoyalties() public {
        // Setup: user deposits, borrows, and links IP
        vm.startPrank(user1);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        vm.prank(address(ipManager));
        vault.linkIP(user1, mockIP1);
        
        // Add royalties
        ipManager.depositRoyalties(mockIP1, 200 ether);
        
        IAutoRepayEngine.RepaymentSimulation memory sim = engine.simulateAutoRepay(user1);
        
        assertEq(sim.currentDebt, 500 ether);
        assertEq(sim.royaltiesAvailable, 200 ether);
        assertEq(sim.repaymentAmount, 200 ether);
        assertEq(sim.remainingDebt, 300 ether);
        assertFalse(sim.willReleaseIP);
    }
    
    function testSimulateAutoRepayFullRepayment() public {
        // Setup: user deposits, borrows, and links IP
        vm.startPrank(user1);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        vm.prank(address(ipManager));
        vault.linkIP(user1, mockIP1);
        
        // Add enough royalties to cover full debt
        ipManager.depositRoyalties(mockIP1, 600 ether);
        
        IAutoRepayEngine.RepaymentSimulation memory sim = engine.simulateAutoRepay(user1);
        
        assertEq(sim.currentDebt, 500 ether);
        assertEq(sim.royaltiesAvailable, 600 ether);
        assertEq(sim.repaymentAmount, 500 ether); // Only repays debt amount
        assertEq(sim.remainingDebt, 0);
        assertTrue(sim.willReleaseIP);
    }
    
    function testExecuteAutoRepay() public {
        // Setup: user deposits, borrows, and links IP
        vm.startPrank(user1);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        vm.prank(address(ipManager));
        vault.linkIP(user1, mockIP1);
        
        // Add royalties
        ipManager.depositRoyalties(mockIP1, 200 ether);
        
        uint256 repaid = engine.executeAutoRepay(user1);
        
        assertEq(repaid, 200 ether);
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.debtAmount, 300 ether);
        
        // Royalties should be consumed
        assertEq(ipManager.getRoyaltyBalance(mockIP1), 0);
    }
    
    function testExecuteAutoRepayFullDebt() public {
        // Setup: user deposits, borrows, and links IP
        vm.startPrank(user1);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        vm.prank(address(ipManager));
        vault.linkIP(user1, mockIP1);
        
        // Add enough royalties to cover full debt
        ipManager.depositRoyalties(mockIP1, 600 ether);
        
        uint256 repaid = engine.executeAutoRepay(user1);
        
        assertEq(repaid, 500 ether);
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.debtAmount, 0);
        assertFalse(position.hasIP); // IP should be released
        
        // Excess royalties should remain
        assertEq(ipManager.getRoyaltyBalance(mockIP1), 100 ether);
    }
    
    function testExecuteAutoRepayNoDebtReverts() public {
        vm.expectRevert(Errors.NoActiveDebt.selector);
        engine.executeAutoRepay(user1);
    }
    
    function testExecuteAutoRepayNoIPReverts() public {
        // Setup: user deposits and borrows but no IP
        vm.startPrank(user1);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        vm.expectRevert(Errors.IPNotLocked.selector);
        engine.executeAutoRepay(user1);
    }
    
    function testExecuteAutoRepayNoRoyaltiesReverts() public {
        // Setup: user deposits, borrows, and links IP
        vm.startPrank(user1);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        vm.prank(address(ipManager));
        vault.linkIP(user1, mockIP1);
        
        // No royalties deposited
        vm.expectRevert(Errors.InsufficientRoyalties.selector);
        engine.executeAutoRepay(user1);
    }
    
    function testMultipleAutoRepayments() public {
        // Setup: user deposits, borrows, and links IP
        vm.startPrank(user1);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        ipManager.acceptIP(user1, mockIP1);
        vm.prank(address(ipManager));
        vault.linkIP(user1, mockIP1);
        
        // First repayment
        ipManager.depositRoyalties(mockIP1, 150 ether);
        engine.executeAutoRepay(user1);
        
        IAutonomyVault.Position memory position = vault.getPosition(user1);
        assertEq(position.debtAmount, 350 ether);
        
        // Second repayment
        ipManager.depositRoyalties(mockIP1, 100 ether);
        engine.executeAutoRepay(user1);
        
        position = vault.getPosition(user1);
        assertEq(position.debtAmount, 250 ether);
        
        // Final repayment
        ipManager.depositRoyalties(mockIP1, 300 ether);
        engine.executeAutoRepay(user1);
        
        position = vault.getPosition(user1);
        assertEq(position.debtAmount, 0);
        assertFalse(position.hasIP); // IP released
    }
}
