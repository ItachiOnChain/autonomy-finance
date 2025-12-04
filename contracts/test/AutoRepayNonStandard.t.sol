// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/AutoRepayEngine.sol";
import "../src/LendingPool.sol";
import "../src/tokens/NonStandardUSDT.sol";
import "../src/tokens/MockERC20.sol";
import "../src/dev/MockUniswapRouter.sol";
import "../src/dev/StoryProtocolMock.sol"; // Contains MockRoyaltyVault, MockIPAssetRegistry
import "../src/tokens/MockRoyaltyToken.sol";
import "../src/IPManager.sol";
import "../src/PriceOracle.sol";
import "../src/AutonomyVault.sol";
import "../src/InterestRateModel.sol";

contract AutoRepayNonStandardTest is Test {
    AutoRepayEngine public autoRepayEngine;
    LendingPool public lendingPool;
    AutonomyVault public vault;
    NonStandardUSDT public usdt; // The non-standard token
    MockERC20 public usdc; // Standard token for comparison
    MockUniswapRouter public router;
    MockRoyaltyVault public royaltyVault;
    MockRoyaltyToken public royaltyToken;
    MockIPAssetRegistry public ipAssetRegistry;
    IPManager public ipManager;
    PriceOracle public priceOracle;
    InterestRateModel public interestRateModel;

    address public user = address(1);
    address public owner = address(this);
    bytes32 public ipaId;

    function setUp() public {
        // 1. Deploy Tokens
        usdt = new NonStandardUSDT(); // Non-standard (no bool return)
        usdc = new MockERC20("USD Coin", "USDC", 6); // Standard (bool return)
        royaltyToken = new MockRoyaltyToken();

        // 2. Deploy Mocks & Real Core Contracts
        priceOracle = new PriceOracle();
        router = new MockUniswapRouter();

        // Story Protocol Mocks
        ipAssetRegistry = new MockIPAssetRegistry();
        royaltyVault = new MockRoyaltyVault(); // Constructor is empty in MockRoyaltyVault

        // Core System
        ipManager = new IPManager();
        interestRateModel = new InterestRateModel(200, 1000, 20000, 8000, 1000);
        lendingPool = new LendingPool(
            address(interestRateModel),
            address(priceOracle)
        );
        vault = new AutonomyVault(address(usdc));

        // 3. Deploy AutoRepayEngine
        autoRepayEngine = new AutoRepayEngine();

        // 4. Wire Dependencies
        vault.setIPManager(address(ipManager));
        vault.setAutoRepayEngine(address(autoRepayEngine));

        ipManager.setVault(address(vault));
        ipManager.setAutoRepayEngine(address(autoRepayEngine));

        autoRepayEngine.setVault(address(vault));
        autoRepayEngine.setIPManager(address(ipManager));
        autoRepayEngine.setLendingPool(address(lendingPool));
        autoRepayEngine.setRouter(address(router));
        autoRepayEngine.setRepayToken(address(usdc));
        autoRepayEngine.setTreasury(owner);

        // 5. Setup Configuration

        // Add markets to LendingPool
        lendingPool.initializeAsset(address(usdt), true, 8000, 8500, 10500);
        lendingPool.initializeAsset(address(usdc), true, 8000, 8500, 10500);

        // Setup Oracle Prices
        priceOracle.setPrice(address(usdt), 1e18); // $1
        priceOracle.setPrice(address(usdc), 1e18); // $1
        priceOracle.setPrice(address(royaltyToken), 1e18); // $1

        // Setup Router Exchange Rates
        // Royalty -> USDT
        router.setExchangeRate(address(royaltyToken), address(usdt), 1e18);
        // Royalty -> USDC
        router.setExchangeRate(address(royaltyToken), address(usdc), 1e18);
        // USDC -> USDT
        router.setExchangeRate(address(usdc), address(usdt), 1e18);

        // Deploy WETH and set in Engine
        MockERC20 weth = new MockERC20("Wrapped Ether", "WETH", 18);
        autoRepayEngine.setWETH(address(weth));

        // Configure AutoRepayEngine
        autoRepayEngine.addSupportedAsset(address(usdt));
        autoRepayEngine.addSupportedAsset(address(usdc));
        autoRepayEngine.setWhitelistedToken(address(royaltyToken), true);
        autoRepayEngine.setWhitelistedToken(address(usdc), true);
        autoRepayEngine.setWhitelistedToken(address(usdt), true);

        // Mint tokens to user, router, and owner
        vm.startPrank(owner);
        usdt.mint(user, 10000 * 1e6);
        usdc.mint(user, 10000 * 1e6);
        royaltyToken.mint(user, 10000 * 1e18);

        usdt.mint(owner, 10000 * 1e6); // Mint to owner for seeding
        usdc.mint(owner, 10000 * 1e6); // Mint to owner for seeding

        // Mint liquidity to router
        usdt.mint(address(router), 100000 * 1e6);
        usdc.mint(address(router), 100000 * 1e6);
        royaltyToken.mint(address(router), 100000 * 1e18);

        // Seed LendingPool liquidity
        usdt.approve(address(lendingPool), 10000 * 1e6);
        lendingPool.seedLiquidity(address(usdt), 10000 * 1e6);
        vm.stopPrank();

        // Create an IP Asset for the user
        vm.startPrank(user);
        ipaId = ipAssetRegistry.mintIP(user, "ipfs://metadata");

        // Create Vault for IPA
        royaltyVault.createVault(ipaId);

        // Lock IPA in IPManager (requires user to be owner)
        ipManager.lockIPA(ipaId, user, 0);

        // Fund the Royalty Vault
        royaltyToken.approve(address(royaltyVault), 1000 * 1e18);
        royaltyVault.payRoyalty(ipaId, address(royaltyToken), 1000 * 1e18);
        vm.stopPrank();

        // MockRoyaltyVault needs to approve AutoRepayEngine to pull tokens?
        // In the real implementation, AutoRepayEngine calls `withdrawRoyalties` on IPManager?
        // Or `claimRoyalty` on Vault?
        // Let's check AutoRepayEngine.sol to see how it pulls funds.
    }

    function testNonStandardUSDTRepay() public {
        // 1. User borrows USDT
        vm.startPrank(user);

        // Supply USDC as collateral
        usdc.approve(address(lendingPool), 1000 * 1e6);
        lendingPool.supply(address(usdc), 1000 * 1e6);

        // Borrow USDT
        lendingPool.borrow(address(usdt), 500 * 1e6);

        uint256 debtBefore = lendingPool
            .getUserPosition(user, address(usdt))
            .borrowed;
        assertEq(debtBefore, 500 * 1e6);

        vm.stopPrank();

        // 2. Execute AutoRepay
        // We need to ensure the AutoRepayEngine can pull funds.
        // AutoRepayEngine calls `ipManager.withdrawRoyalties`?
        // Or does it expect the user to have approved it?
        // The function is `autoRepayFromRoyalty`.

        // Let's check `AutoRepayEngine.sol` logic for `autoRepayFromRoyalty`.
        // It calls `IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);`
        // So the USER calls this function, and the USER pays with their own tokens (or tokens they claimed).
        // Wait, `autoRepayFromRoyalty` implies paying *from* royalty?
        // If the user has already claimed royalties to their wallet, then it's just a normal repayment helper.

        // Ah, looking at `AutoRepayEngine.sol`:
        // `function autoRepayFromRoyalty(...)`
        // It transfers `tokenIn` from `msg.sender`.
        // So the user must have the tokens.

        // In the frontend flow:
        // 1. User claims royalties (Vault -> User).
        // 2. User calls autoRepayFromRoyalty (User -> Engine -> Repay).

        // So in this test, we need to simulate the user having the royalty tokens.
        // We already funded the vault, let's claim them first or just mint more to user.
        // We minted 10000 to user, and used 1000 for vault. User has 9000 left.

        vm.startPrank(user);

        // Approve AutoRepayEngine to spend user's RoyaltyToken
        royaltyToken.approve(address(autoRepayEngine), 600 * 1e18);

        // Execute AutoRepay
        // This will:
        // 1. Pull RoyaltyToken from User
        // 2. Swap RoyaltyToken -> USDC (RepayToken)
        // 3. Swap USDC -> USDT (Debt Asset)
        // 4. Repay USDT debt

        autoRepayEngine.autoRepayFromRoyalty(
            ipaId,
            address(royaltyToken),
            600 * 1e18, // Amount of royalty to use ($600)
            0, // Min out
            50, // Slippage
            address(usdt) // Preferred debt asset
        );

        uint256 debtAfter = lendingPool
            .getUserPosition(user, address(usdt))
            .borrowed;

        // Should have repaid 500 USDT
        // We used $600 worth of royalties. Debt was $500.
        // Should be fully repaid.
        assertEq(debtAfter, 0);

        vm.stopPrank();
    }

    function testNonStandardUSDTApproval() public {
        // Test direct forceApprove usage on the non-standard token
        address spender = address(0x123);
        uint256 amount = 1000;

        vm.startPrank(address(autoRepayEngine));

        // Verify the mock behaves as expected (no return)
        (bool success, bytes memory data) = address(usdt).call(
            abi.encodeWithSelector(usdt.approve.selector, spender, amount)
        );
        assertTrue(success, "Approve call failed");
        assertEq(data.length, 0, "Approve should return no data");

        vm.stopPrank();
    }
}
