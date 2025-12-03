// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AutonomyVault.sol";
import "../src/IPManager.sol";
import "../src/AutoRepayEngine.sol";
import "../src/CollateralToken.sol";

contract IntegrationTest is Test {
    AutonomyVault public vault;
    IPManager public ipManager;
    AutoRepayEngine public engine;
    CollateralToken public token;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public aliceIP = address(0x999);
    address public bobIP = address(0x888);
    
    function setUp() public {
        // Deploy all contracts
        token = new CollateralToken();
        vault = new AutonomyVault(address(token));
        ipManager = new IPManager();
        engine = new AutoRepayEngine();
        
        // Wire contracts together
        vault.setIPManager(address(ipManager));
        vault.setAutoRepayEngine(address(engine));
        ipManager.setVault(address(vault));
        ipManager.setAutoRepayEngine(address(engine));
        engine.setVault(address(vault));
        engine.setIPManager(address(ipManager));
        
        // Setup users
        token.mint(alice, 10000 ether);
        token.mint(bob, 10000 ether);
        token.mint(address(vault), 100000 ether); // Fund vault for borrowing
        
        vm.prank(alice);
        token.approve(address(vault), type(uint256).max);
        
        vm.prank(bob);
        token.approve(address(vault), type(uint256).max);
    }
    
    function testFullUserFlow() public {
        // Alice's journey
        console.log("=== Alice's Journey ===");
        
        // 1. Alice deposits collateral
        vm.prank(alice);
        vault.depositCollateral(1000 ether);
        console.log("Alice deposited 1000 ether collateral");
        
        // 2. Alice assigns her IP
        ipManager.acceptIP(alice, aliceIP);
        vm.prank(address(ipManager));
        vault.linkIP(alice, aliceIP);
        console.log("Alice assigned IP asset");
        
        // 3. Alice borrows
        vm.prank(alice);
        vault.borrow(600 ether);
        console.log("Alice borrowed 600 ether");
        
        IAutonomyVault.Position memory alicePos = vault.getPosition(alice);
        assertEq(alicePos.debtAmount, 600 ether);
        assertTrue(alicePos.hasIP);
        
        // 4. Alice's IP generates royalties
        ipManager.depositRoyalties(aliceIP, 250 ether);
        console.log("Alice's IP generated 250 ether royalties");
        
        // 5. Simulate auto-repay
        IAutoRepayEngine.RepaymentSimulation memory sim = engine.simulateAutoRepay(alice);
        console.log("Simulation - Will repay:", sim.repaymentAmount);
        console.log("Simulation - Remaining debt:", sim.remainingDebt);
        assertEq(sim.repaymentAmount, 250 ether);
        assertEq(sim.remainingDebt, 350 ether);
        
        // 6. Execute auto-repay
        engine.executeAutoRepay(alice);
        console.log("Auto-repay executed");
        
        alicePos = vault.getPosition(alice);
        assertEq(alicePos.debtAmount, 350 ether);
        assertTrue(alicePos.hasIP); // Still locked
        
        // 7. More royalties come in
        ipManager.depositRoyalties(aliceIP, 400 ether);
        console.log("Alice's IP generated another 400 ether royalties");
        
        // 8. Execute final auto-repay
        engine.executeAutoRepay(alice);
        console.log("Final auto-repay executed");
        
        alicePos = vault.getPosition(alice);
        assertEq(alicePos.debtAmount, 0);
        assertFalse(alicePos.hasIP); // IP released!
        assertFalse(ipManager.isIPLocked(alice));
        
        console.log("Alice's debt fully repaid, IP released!");
    }
    
    function testMultipleUsers() public {
        // Alice's flow
        vm.prank(alice);
        vault.depositCollateral(1000 ether);
        
        ipManager.acceptIP(alice, aliceIP);
        vm.prank(address(ipManager));
        vault.linkIP(alice, aliceIP);
        
        vm.prank(alice);
        vault.borrow(500 ether);
        
        // Bob's flow
        vm.prank(bob);
        vault.depositCollateral(2000 ether);
        
        ipManager.acceptIP(bob, bobIP);
        vm.prank(address(ipManager));
        vault.linkIP(bob, bobIP);
        
        vm.prank(bob);
        vault.borrow(1000 ether);
        
        // Both have debt
        assertEq(vault.getPosition(alice).debtAmount, 500 ether);
        assertEq(vault.getPosition(bob).debtAmount, 1000 ether);
        
        // Alice's IP generates royalties
        ipManager.depositRoyalties(aliceIP, 500 ether);
        engine.executeAutoRepay(alice);
        
        // Alice's debt cleared, Bob's unchanged
        assertEq(vault.getPosition(alice).debtAmount, 0);
        assertEq(vault.getPosition(bob).debtAmount, 1000 ether);
        assertFalse(vault.getPosition(alice).hasIP);
        assertTrue(vault.getPosition(bob).hasIP);
        
        // Bob's IP generates royalties
        ipManager.depositRoyalties(bobIP, 600 ether);
        engine.executeAutoRepay(bob);
        
        // Bob partially repaid
        assertEq(vault.getPosition(bob).debtAmount, 400 ether);
        assertTrue(vault.getPosition(bob).hasIP);
    }
    
    function testManualRepayWithIP() public {
        // User can manually repay even with IP locked
        vm.prank(alice);
        vault.depositCollateral(1000 ether);
        
        ipManager.acceptIP(alice, aliceIP);
        vm.prank(address(ipManager));
        vault.linkIP(alice, aliceIP);
        
        vm.prank(alice);
        vault.borrow(500 ether);
        
        // Manual repayment
        vm.prank(alice);
        vault.repay(500 ether);
        
        // Debt cleared, IP released
        IAutonomyVault.Position memory pos = vault.getPosition(alice);
        assertEq(pos.debtAmount, 0);
        assertFalse(pos.hasIP);
        assertFalse(ipManager.isIPLocked(alice));
    }
    
    function testBorrowWithoutIP() public {
        // Users can borrow without IP
        vm.startPrank(alice);
        vault.depositCollateral(1000 ether);
        vault.borrow(500 ether);
        vm.stopPrank();
        
        IAutonomyVault.Position memory pos = vault.getPosition(alice);
        assertEq(pos.debtAmount, 500 ether);
        assertFalse(pos.hasIP);
        
        // Can repay normally
        vm.prank(alice);
        vault.repay(500 ether);
        
        assertEq(vault.getPosition(alice).debtAmount, 0);
    }
}
