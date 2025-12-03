// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/IPManager.sol";
import "../src/AutoRepayEngine.sol";
import "../src/AutonomyVault.sol";
import "../src/dev/StoryProtocolMock.sol";
import "../src/dev/MockUniswapRouter.sol";
import "../src/tokens/MockRoyaltyToken.sol";
import "../src/tokens/USDC.sol";
import "../src/tokens/USDT.sol";
import "../src/tokens/WETH.sol";
import "../src/tokens/DAI.sol";

/**
 * @title StoryProtocolIntegrationTest
 * @notice Comprehensive tests for Story Protocol integration
 */
contract StoryProtocolIntegrationTest is Test {
    // Contracts
    IPManager public ipManager;
    AutoRepayEngine public autoRepayEngine;
    AutonomyVault public vault;
    MockIPAssetRegistry public mockIPRegistry;
    MockRoyaltyVault public mockRoyaltyVault;
    MockUniswapRouter public mockRouter;
    MockRoyaltyToken public mockToken;
    USDC public usdc;

    // Test accounts
    address public owner;
    address public user1;
    address public user2;
    address public treasury;

    // Test IPA ID
    bytes32 public testIpaId;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        treasury = address(0x3);

        // Deploy tokens
        usdc = new USDC();
        mockToken = new MockRoyaltyToken();

        // Deploy Story Protocol mocks
        mockIPRegistry = new MockIPAssetRegistry();
        mockRoyaltyVault = new MockRoyaltyVault();
        mockRouter = new MockUniswapRouter();

        // Deploy core contracts
        vault = new AutonomyVault(address(usdc));
        ipManager = new IPManager();
        autoRepayEngine = new AutoRepayEngine();

        // Wire dependencies
        ipManager.setVault(address(vault));
        ipManager.setAutoRepayEngine(address(autoRepayEngine));
        autoRepayEngine.setVault(address(vault));
        autoRepayEngine.setIPManager(address(ipManager));
        vault.setIPManager(address(ipManager));
        vault.setAutoRepayEngine(address(autoRepayEngine));

        // Configure AutoRepayEngine
        autoRepayEngine.setRouter(address(mockRouter));
        autoRepayEngine.setWETH(address(usdc)); // Use USDC as WETH for simplicity
        autoRepayEngine.setRepayToken(address(usdc));
        autoRepayEngine.setTreasury(treasury);
        autoRepayEngine.setWhitelistedToken(address(usdc), true);
        autoRepayEngine.setWhitelistedToken(address(mockToken), true);
        autoRepayEngine.setConversionFee(10); // 0.1%

        // Configure router
        mockRouter.setExchangeRate(address(mockToken), address(usdc), 1e18); // 1:1
        mockRouter.setSimulatedSlippage(50); // 0.5%

        // Mint liquidity to router
        mockToken.mint(address(mockRouter), 10_000_000 * 1e18);
        usdc.mint(address(mockRouter), 10_000_000 * 1e6);

        // Mint test tokens to users
        mockToken.mint(user1, 100_000 * 1e18);
        usdc.mint(user1, 100_000 * 1e6);

        // Mint IP for testing
        vm.prank(user1);
        testIpaId = mockIPRegistry.mintIP(user1, "ipfs://test-metadata");
    }

    // ===== IPA Locking/Unlocking Tests =====

    function testLockIPA() public {
        uint256 collateralValue = 10_000 * 1e18; // $10,000

        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, collateralValue);

        assertEq(ipManager.getIPAOwner(testIpaId), user1);
        assertEq(ipManager.getIPACollateralValue(testIpaId), collateralValue);
        assertTrue(ipManager.isIPALocked(testIpaId));
    }

    function testCannotLockIPATwice() public {
        uint256 collateralValue = 10_000 * 1e18;

        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, collateralValue);

        vm.prank(user1);
        vm.expectRevert("IPA already locked");
        ipManager.lockIPA(testIpaId, user1, collateralValue);
    }

    function testUnlockIPAWithZeroDebt() public {
        uint256 collateralValue = 10_000 * 1e18;

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, collateralValue);

        // Unlock (no debt)
        vm.prank(user1);
        ipManager.unlockIPA(testIpaId);

        assertEq(ipManager.getIPAOwner(testIpaId), address(0));
        assertFalse(ipManager.isIPALocked(testIpaId));
    }

    // Helper to create debt
    function _createDebt(address user, uint256 amount) internal {
        // Calculate required collateral (LTV is 75%)
        // Need collateral * 0.75 >= debt
        // collateral >= debt / 0.75 = debt * 4 / 3
        uint256 requiredCollateral = (amount * 10000) / 7500 + 1e6; // Add buffer

        // Mint as owner (test contract)
        usdc.mint(user, requiredCollateral);

        vm.startPrank(user);
        usdc.approve(address(vault), requiredCollateral);
        vault.depositCollateral(requiredCollateral);
        vault.borrow(amount);
        vm.stopPrank();
    }

    function testCannotUnlockIPAWithDebt() public {
        uint256 collateralValue = 10_000 * 1e18;

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, collateralValue);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Try to unlock (should fail)
        vm.prank(user1);
        vm.expectRevert(Errors.DebtNotZero.selector);
        ipManager.unlockIPA(testIpaId);
    }

    // ===== Multi-Token Royalty Tests =====

    function testDepositRoyalties() public {
        uint256 amount = 1000 * 1e18;

        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(mockToken), amount);

        assertEq(
            ipManager.getRoyaltyBalance(testIpaId, address(mockToken)),
            amount
        );
    }

    function testDepositMultipleTokens() public {
        uint256 mockAmount = 1000 * 1e18;
        uint256 usdcAmount = 500 * 1e6;

        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(mockToken), mockAmount);

        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(usdc), usdcAmount);

        assertEq(
            ipManager.getRoyaltyBalance(testIpaId, address(mockToken)),
            mockAmount
        );
        assertEq(
            ipManager.getRoyaltyBalance(testIpaId, address(usdc)),
            usdcAmount
        );
    }

    function testWithdrawRoyalties() public {
        uint256 amount = 1000 * 1e18;

        // Deposit
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(mockToken), amount);

        // Withdraw (as autoRepayEngine)
        vm.prank(address(autoRepayEngine));
        uint256 withdrawn = ipManager.withdrawRoyalties(
            testIpaId,
            address(mockToken),
            amount
        );

        assertEq(withdrawn, amount);
        assertEq(ipManager.getRoyaltyBalance(testIpaId, address(mockToken)), 0);
    }

    // ===== Token Conversion Tests =====

    function testDirectRepay_SameToken() public {
        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Deposit royalties in USDC (same as repay token)
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(usdc), 500 * 1e6);

        // Approve autoRepayEngine to spend USDC
        vm.prank(user1);
        usdc.approve(address(autoRepayEngine), 500 * 1e6);

        // Auto-repay (no conversion needed)
        vm.prank(user1);
        uint256 repaid = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(usdc),
            500 * 1e6,
            490 * 1e6, // minOut (with slippage)
            100 // 1% slippage
        );

        // Fee deducted: 500 * 0.001 = 0.5 USDC
        assertGt(repaid, 0);
    }

    function testConversionRepay_DifferentToken() public {
        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Deposit royalties in MOCK token
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(mockToken), 500 * 1e18);

        // Approve autoRepayEngine to spend MOCK tokens
        vm.prank(user1);
        mockToken.approve(address(autoRepayEngine), 500 * 1e18);

        // Auto-repay with conversion
        vm.prank(user1);
        uint256 repaid = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(mockToken),
            500 * 1e18,
            490 * 1e6, // minOut
            100 // 1% slippage
        );

        assertGt(repaid, 0);
    }

    function testSlippageProtection() public {
        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Approve autoRepayEngine to spend MOCK tokens
        vm.prank(user1);
        mockToken.approve(address(autoRepayEngine), 500 * 1e18);

        // Try to repay with unrealistic minOut (should revert)
        vm.prank(user1);
        vm.expectRevert("Insufficient output amount");
        autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(mockToken),
            500 * 1e18,
            600 * 1e6, // Unrealistic minOut
            100
        );
    }

    function testNonWhitelistedToken_Reverts() public {
        // Deploy non-whitelisted token
        MockRoyaltyToken nonWhitelisted = new MockRoyaltyToken();

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Try to repay with non-whitelisted token
        vm.prank(user1);
        vm.expectRevert("Token not whitelisted - use off-chain conversion");
        autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(nonWhitelisted),
            500 * 1e18,
            490 * 1e6,
            100
        );
    }

    // ===== Access Control Tests =====

    function testOnlyOwnerCanLockIPA() public {
        vm.prank(user2);
        vm.expectRevert();
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);
    }

    function testOnlyOwnerCanUnlockIPA() public {
        // Lock as user1
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Try to unlock as user2
        vm.prank(user2);
        vm.expectRevert("Unauthorized");
        ipManager.unlockIPA(testIpaId);
    }

    function testOnlyAutoRepayEngineCanWithdrawRoyalties() public {
        // Deposit royalties
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(mockToken), 1000 * 1e18);

        // Try to withdraw as unauthorized user
        vm.prank(user2);
        vm.expectRevert("Unauthorized");
        ipManager.withdrawRoyalties(testIpaId, address(mockToken), 1000 * 1e18);
    }

    // ===== Partial Repay Tests =====

    function testPartialRepay_InsufficientRoyalties() public {
        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create large debt
        _createDebt(user1, 5000 * 1e6);

        // Deposit small royalties
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(usdc), 500 * 1e6);

        // Approve
        vm.prank(user1);
        usdc.approve(address(autoRepayEngine), 500 * 1e6);

        // Auto-repay (partial)
        vm.prank(user1);
        uint256 repaid = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(usdc),
            500 * 1e6,
            490 * 1e6,
            100
        );

        // Should repay partial amount
        assertGt(repaid, 0);
        assertLt(repaid, 5000 * 1e6);
    }

    // ===== Conversion Fee Tests =====

    function testConversionFee_Deducted() public {
        uint256 treasuryBalanceBefore = usdc.balanceOf(treasury);

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Approve autoRepayEngine to spend MOCK tokens
        vm.prank(user1);
        mockToken.approve(address(autoRepayEngine), 1000 * 1e18);

        // Auto-repay with conversion
        vm.prank(user1);
        autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(mockToken),
            1000 * 1e18,
            990 * 1e6,
            100
        );

        // Check treasury received fee
        uint256 treasuryBalanceAfter = usdc.balanceOf(treasury);
        assertGt(treasuryBalanceAfter, treasuryBalanceBefore);
    }

    // ===== Multi-Token Royalty Repayment Tests =====

    function testRoyaltyRepay_USDT() public {
        // Deploy USDT (6 decimals)
        USDT usdt = new USDT();

        // Configure router and whitelist
        mockRouter.setExchangeRate(address(usdt), address(usdc), 1e18); // 1:1
        autoRepayEngine.setWhitelistedToken(address(usdt), true);

        // Mint liquidity to router
        usdt.mint(address(mockRouter), 10_000_000 * 1e6);

        // Mint USDT to user1
        usdt.mint(user1, 100_000 * 1e6);

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Deposit royalties in USDT
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(usdt), 500 * 1e6);

        // Approve autoRepayEngine to spend USDT
        vm.prank(user1);
        usdt.approve(address(autoRepayEngine), 500 * 1e6);

        // Auto-repay with USDT
        vm.prank(user1);
        uint256 repaid = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(usdt),
            500 * 1e6,
            490 * 1e6, // minOut (with slippage)
            100 // 1% slippage
        );

        // Verify repayment occurred
        assertGt(repaid, 0);

        // Verify debt was reduced
        IAutonomyVault.Position memory pos = vault.getPosition(user1);
        assertLt(pos.debtAmount, 1000 * 1e6);
    }

    function testRoyaltyRepay_WETH() public {
        // Deploy WETH (18 decimals)
        WETH weth = new WETH();

        // Configure router and whitelist (1 WETH = 2000 USDC)
        mockRouter.setExchangeRate(address(weth), address(usdc), 2000e18);
        autoRepayEngine.setWhitelistedToken(address(weth), true);

        // Mint liquidity to router
        weth.mint(address(mockRouter), 10_000 * 1e18);

        // Mint WETH to user1
        weth.mint(user1, 100 * 1e18);

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Deposit royalties in WETH (0.5 WETH = ~1000 USDC)
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(weth), 0.5 * 1e18);

        // Approve autoRepayEngine to spend WETH
        vm.prank(user1);
        weth.approve(address(autoRepayEngine), 0.5 * 1e18);

        // Auto-repay with WETH
        vm.prank(user1);
        uint256 repaid = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(weth),
            0.5 * 1e18,
            900 * 1e6, // minOut (with slippage and fees)
            100 // 1% slippage
        );

        // Verify repayment occurred
        assertGt(repaid, 0);

        // Verify debt was reduced
        IAutonomyVault.Position memory pos = vault.getPosition(user1);
        assertLt(pos.debtAmount, 1000 * 1e6);
    }

    function testRoyaltyRepay_DAI() public {
        // Deploy DAI (18 decimals)
        DAI dai = new DAI();

        // Configure router and whitelist (1 DAI = 1 USDC)
        mockRouter.setExchangeRate(address(dai), address(usdc), 1e18);
        autoRepayEngine.setWhitelistedToken(address(dai), true);

        // Mint liquidity to router
        dai.mint(address(mockRouter), 10_000_000 * 1e18);

        // Mint DAI to user1
        dai.mint(user1, 100_000 * 1e18);

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt
        _createDebt(user1, 1000 * 1e6);

        // Deposit royalties in DAI
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(dai), 500 * 1e18);

        // Approve autoRepayEngine to spend DAI
        vm.prank(user1);
        dai.approve(address(autoRepayEngine), 500 * 1e18);

        // Auto-repay with DAI
        vm.prank(user1);
        uint256 repaid = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(dai),
            500 * 1e18,
            490 * 1e6, // minOut (with slippage)
            100 // 1% slippage
        );

        // Verify repayment occurred
        assertGt(repaid, 0);

        // Verify debt was reduced
        IAutonomyVault.Position memory pos = vault.getPosition(user1);
        assertLt(pos.debtAmount, 1000 * 1e6);
    }

    function testRoyaltyRepay_MultipleTokens_FullDebt() public {
        // Deploy tokens
        USDT usdt = new USDT();
        DAI dai = new DAI();

        // Configure router and whitelist
        mockRouter.setExchangeRate(address(usdt), address(usdc), 1e18);
        mockRouter.setExchangeRate(address(dai), address(usdc), 1e18);
        autoRepayEngine.setWhitelistedToken(address(usdt), true);
        autoRepayEngine.setWhitelistedToken(address(dai), true);

        // Mint liquidity to router
        usdt.mint(address(mockRouter), 10_000_000 * 1e6);
        dai.mint(address(mockRouter), 10_000_000 * 1e18);

        // Mint tokens to user1
        usdt.mint(user1, 100_000 * 1e6);
        dai.mint(user1, 100_000 * 1e18);

        // Lock IPA
        vm.prank(user1);
        ipManager.lockIPA(testIpaId, user1, 10_000 * 1e18);

        // Create debt of 1000 USDC
        _createDebt(user1, 1000 * 1e6);

        // Deposit royalties in USDT (300)
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(usdt), 300 * 1e6);

        // Deposit royalties in DAI (400)
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(dai), 400 * 1e18);

        // Deposit royalties in MockToken (300)
        vm.prank(user1);
        ipManager.depositRoyalties(testIpaId, address(mockToken), 300 * 1e18);

        // First repayment with USDT
        vm.startPrank(user1);
        usdt.approve(address(autoRepayEngine), 300 * 1e6);
        uint256 repaid1 = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(usdt),
            300 * 1e6,
            290 * 1e6,
            100
        );
        vm.stopPrank();

        assertGt(repaid1, 0);

        // Second repayment with DAI
        vm.startPrank(user1);
        dai.approve(address(autoRepayEngine), 400 * 1e18);
        uint256 repaid2 = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(dai),
            400 * 1e18,
            390 * 1e6,
            100
        );
        vm.stopPrank();

        assertGt(repaid2, 0);

        // Third repayment with MockToken
        vm.startPrank(user1);
        mockToken.approve(address(autoRepayEngine), 300 * 1e18);
        uint256 repaid3 = autoRepayEngine.autoRepayFromRoyalty(
            testIpaId,
            address(mockToken),
            300 * 1e18,
            290 * 1e6,
            100
        );
        vm.stopPrank();

        assertGt(repaid3, 0);

        // Verify total debt is significantly reduced or zero
        IAutonomyVault.Position memory pos = vault.getPosition(user1);
        assertLt(pos.debtAmount, 100 * 1e6); // Should be nearly paid off
    }
}
