// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Test.sol";
import "../src/core/AutonomyV1.sol";
import "../src/adapters/Adapter.sol";
import "../src/tokens/CollateralToken.sol";
import "../src/tokens/AtAsset.sol";
import "../src/tokens/MintableBurnableERC20.sol";
import "../src/interfaces/IERC20Minimal.sol";
import "../src/interfaces/ITokenAdapter.sol";
import "../src/base/Errors.sol";

contract AutonomyV1Test is Test {
    AutonomyV1 public autonomy;
    Adapter public adapter;
    CollateralToken public collateral;
    AtAsset public atAsset;
    
    address public admin = address(1);
    address public user = address(2);
    address public keeper = address(3);
    
    uint256 public constant INITIAL_EXCHANGE_RATE = 1e18;
    uint256 public constant APY = 0.1e18; // 10% APY
    
    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy tokens
        collateral = new CollateralToken();
        atAsset = new AtAsset("Autonomy USD", "atUSD", 18);
        
        // Deploy adapter
        adapter = new Adapter(
            IERC20Minimal(address(collateral)),
            "Yield Token",
            "YT",
            INITIAL_EXCHANGE_RATE,
            APY
        );
        
        // Deploy Autonomy
        autonomy = new AutonomyV1();
        autonomy.setAdmin(admin);
        
        // Register yield token (adapter already set itself as minter in constructor)
        address yieldToken = address(adapter.yieldToken());
        autonomy.registerYieldToken(yieldToken, adapter);
        
        // Register debt token
        autonomy.registerDebtToken(address(atAsset));
        
        // Set Autonomy as minter for atAsset
        atAsset.setMinter(address(autonomy));
        
        vm.stopPrank();
        
        // Setup user
        vm.startPrank(user);
        collateral.mintForTesting(user, 10000e18);
        collateral.approve(address(adapter), type(uint256).max);
        collateral.approve(address(autonomy), type(uint256).max);
        vm.stopPrank();
    }
    
    function testDeposit() public {
        vm.startPrank(user);
        
        uint256 depositAmount = 1000e18;
        uint256 shares = autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        assertGt(shares, 0);
        assertEq(autonomy.depositedShares(user, address(adapter.yieldToken())), shares);
        assertEq(autonomy.getTotalDeposited(address(adapter.yieldToken())), depositAmount);
        
        vm.stopPrank();
    }
    
    function testMint() public {
        vm.startPrank(user);
        
        // First deposit collateral
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        // Then mint debt
        uint256 mintAmount = 500e18;
        autonomy.mint(address(atAsset), mintAmount, user);
        
        assertEq(autonomy.getDebt(user, address(atAsset)), mintAmount);
        assertEq(atAsset.balanceOf(user), mintAmount);
        
        vm.stopPrank();
    }
    
    function testMintFailsIfInsufficientCollateral() public {
        vm.startPrank(user);
        
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        // Try to mint more than collateral allows (150% ratio means max 666e18)
        uint256 mintAmount = 700e18;
        vm.expectRevert();
        autonomy.mint(address(atAsset), mintAmount, user);
        
        vm.stopPrank();
    }
    
    function testHarvest() public {
        vm.startPrank(user);
        
        // Deposit and mint
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        autonomy.mint(address(atAsset), 500e18, user);
        
        vm.stopPrank();
        
        // Fast forward time to accrue yield
        vm.warp(block.timestamp + 365 days);
        
        // Harvest yield
        vm.prank(keeper);
        uint256 yield = autonomy.harvest(address(adapter.yieldToken()));
        
        assertGt(yield, 0);
    }
    
    function testRepay() public {
        vm.startPrank(user);
        
        // Deposit and mint
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        uint256 mintAmount = 500e18;
        autonomy.mint(address(atAsset), mintAmount, user);
        
        // Repay half
        uint256 repayAmount = 250e18;
        atAsset.approve(address(autonomy), repayAmount);
        autonomy.repay(address(atAsset), repayAmount, user);
        
        assertEq(autonomy.getDebt(user, address(atAsset)), mintAmount - repayAmount);
        
        vm.stopPrank();
    }
    
    function testWithdraw() public {
        vm.startPrank(user);
        
        // Deposit
        uint256 depositAmount = 1000e18;
        uint256 shares = autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        // Withdraw half
        uint256 withdrawShares = shares / 2;
        autonomy.withdraw(address(adapter.yieldToken()), withdrawShares, user);
        
        assertEq(autonomy.depositedShares(user, address(adapter.yieldToken())), shares - withdrawShares);
        
        vm.stopPrank();
    }
    
    function testWithdrawFailsIfUndercollateralized() public {
        vm.startPrank(user);
        
        // Deposit and mint
        uint256 depositAmount = 1000e18;
        uint256 shares = autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        autonomy.mint(address(atAsset), 500e18, user);
        
        // Try to withdraw too much (should revert with InsufficientCollateral)
        vm.expectRevert(Errors.InsufficientCollateral.selector);
        autonomy.withdraw(address(adapter.yieldToken()), shares, user);
        
        vm.stopPrank();
    }
}

