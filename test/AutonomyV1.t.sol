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
import "../src/interfaces/IPriceOracle.sol";
import "../src/mocks/MockOracle.sol";
import "../src/base/Errors.sol";
import "../src/utils/Whitelist.sol";

contract AutonomyV1Test is Test {
    AutonomyV1 public autonomy;
    Adapter public adapter;
    CollateralToken public collateral;
    AtAsset public atAsset;
    MockOracle public oracle;
    
    address public admin = address(1);
    address public user = address(2);
    address public keeper = address(3);
    
    uint256 public constant INITIAL_EXCHANGE_RATE = 1e18;
    uint256 public constant APY = 0.1e18; // 10% APY
    
    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy oracle
        oracle = new MockOracle(admin);
        
        // Deploy tokens
        collateral = new CollateralToken();
        atAsset = new AtAsset("Autonomy USD", "atUSD", 18);
        
        // Deploy adapter
        adapter = new Adapter(
            admin,
            IERC20Minimal(address(collateral)),
            "Yield Token",
            "YT",
            INITIAL_EXCHANGE_RATE,
            APY
        );
        
        // Deploy Autonomy
        autonomy = new AutonomyV1(admin, IPriceOracle(address(oracle)));
        
        // Set prices in oracle (default 1e18 = parity)
        oracle.setPrice(address(collateral), 1e18);
        oracle.setPrice(address(atAsset), 1e18);
        
        // Register yield token
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
    
    function testOraclePriceAffectsLTV() public {
        vm.startPrank(user);
        
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        // With 1e18 price, can mint up to ~666e18
        uint256 mintAmount = 600e18;
        autonomy.mint(address(atAsset), mintAmount, user);
        
        // Set price to 0.9e18 (collateral worth less)
        vm.stopPrank();
        vm.startPrank(admin);
        oracle.setPrice(address(collateral), 0.9e18);
        vm.stopPrank();
        
        // Now minting should fail earlier
        vm.startPrank(user);
        vm.expectRevert();
        autonomy.mint(address(atAsset), 100e18, user);
        
        vm.stopPrank();
    }
    
    function testAccrualGuard() public {
        vm.startPrank(user);
        
        // Deposit before time warp
        uint256 depositAmount = 1000e18;
        uint256 shares1 = autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        // Fast forward time
        vm.warp(block.timestamp + 365 days);
        
        // Deposit after time warp - accrual guard ensures exchange rate is updated
        // Shares will be less because exchange rate increased (yield accrued)
        uint256 shares2 = autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        // Shares should be less (exchange rate increased due to yield)
        assertLt(shares2, shares1);
        
        // Verify exchange rate was updated (accrual guard worked)
        uint256 rate1 = adapter.getExchangeRate();
        assertGt(rate1, INITIAL_EXCHANGE_RATE);
        
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
        // Note: harvest() will accrue yield internally
        vm.prank(keeper);
        uint256 yield = autonomy.harvest(address(adapter.yieldToken()));
        
        // Yield should be > 0 after time warp
        assertGt(yield, 0);
    }
    
    function testAutoRepay() public {
        vm.startPrank(user);
        
        // Deposit and mint
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        uint256 mintAmount = 500e18;
        autonomy.mint(address(atAsset), mintAmount, user);
        
        uint256 totalDebtBefore = autonomy.getTotalDebt(address(atAsset));
        assertEq(totalDebtBefore, mintAmount);
        
        vm.stopPrank();
        
        // Fast forward time to accrue yield
        vm.warp(block.timestamp + 365 days);
        
        // Harvest yield (should auto-repay debt)
        // Note: harvest() will accrue yield internally
        vm.prank(keeper);
        autonomy.harvest(address(adapter.yieldToken()));
        
        // Total debt should be reduced
        uint256 totalDebtAfter = autonomy.getTotalDebt(address(atAsset));
        assertLt(totalDebtAfter, totalDebtBefore);
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
        
        // Cache yield token address before expectRevert
        address yieldToken = address(adapter.yieldToken());
        
        // Try to withdraw too much (should revert with InsufficientCollateral)
        vm.expectRevert(Errors.InsufficientCollateral.selector);
        autonomy.withdraw(yieldToken, shares, user);
        
        vm.stopPrank();
    }
    
    function testPausing() public {
        // Note: whitelist check runs before pause check, so we need to ensure user is whitelisted
        // In production, whitelist would be set up before pausing
        
        vm.startPrank(user);
        
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        vm.stopPrank();
        
        // Pause deposit function
        vm.startPrank(admin);
        bytes4 depositSelector = bytes4(keccak256(bytes("deposit(address,uint256,address)")));
        autonomy.pauseFunction(depositSelector);
        vm.stopPrank();
        
        // Cache yield token address before expectRevert
        address yieldToken = address(adapter.yieldToken());
        
        // Deposit should revert with Paused (whitelist check passes since whitelist is not set)
        vm.startPrank(user);
        vm.expectRevert(Errors.Paused.selector);
        autonomy.deposit(yieldToken, 100e18, user);
        
        vm.stopPrank();
    }
    
    function testWhitelist() public {
        // Deploy whitelist
        vm.startPrank(admin);
        Whitelist whitelist = new Whitelist(admin);
        autonomy.setWhitelist(address(whitelist));
        whitelist.set(user, true);
        vm.stopPrank();
        
        // User should be able to deposit
        vm.startPrank(user);
        uint256 depositAmount = 1000e18;
        autonomy.deposit(address(adapter.yieldToken()), depositAmount, user);
        
        vm.stopPrank();
        
        // Remove from whitelist
        vm.startPrank(admin);
        whitelist.set(user, false);
        vm.stopPrank();
        
        // Cache yield token address before expectRevert
        address yieldToken = address(adapter.yieldToken());
        
        // User should not be able to deposit
        vm.startPrank(user);
        vm.expectRevert(Errors.NotWhitelisted.selector);
        autonomy.deposit(yieldToken, 100e18, user);
        
        vm.stopPrank();
    }
}