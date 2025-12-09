// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/dev/StoryProtocolMock.sol";
import "../src/tokens/USDC.sol";
import "../src/tokens/MockRoyaltyToken.sol";
import "../src/story/AutoRepayEngine.sol";
import "../src/AutonomyVault.sol";
import "../src/IPManager.sol";
import "../src/dev/MockUniswapRouter.sol";

contract RoyaltyPaymentTest is Test {
    MockIPAssetRegistry public ipRegistry;
    MockRoyaltyVault public royaltyVault;
    USDC public usdc;
    MockRoyaltyToken public mockToken;

    address public user = address(0x1);

    function setUp() public {
        ipRegistry = new MockIPAssetRegistry();
        royaltyVault = new MockRoyaltyVault();
        usdc = new USDC();
        mockToken = new MockRoyaltyToken();

        // Mint tokens to user
        usdc.mint(user, 10000 * 1e6); // 10,000 USDC
        mockToken.mint(user, 10000 * 1e18); // 10,000 MOCK
    }

    function testPayRoyalty_MockToken() public {
        // Mint IP
        vm.prank(user);
        bytes32 ipaId = ipRegistry.mintIP(user, "ipfs://test");

        // Create vault
        royaltyVault.createVault(ipaId);

        // Pay royalty with mock token
        vm.startPrank(user);
        mockToken.approve(address(royaltyVault), 100 * 1e18);
        royaltyVault.payRoyalty(ipaId, address(mockToken), 100 * 1e18);
        vm.stopPrank();

        // Verify balance
        uint256 balance = royaltyVault.getRoyaltyBalance(
            ipaId,
            address(mockToken)
        );
        assertEq(balance, 100 * 1e18, "Royalty balance should be 100 MOCK");
    }

    function testPayRoyalty_USDC() public {
        // Mint IP
        vm.prank(user);
        bytes32 ipaId = ipRegistry.mintIP(user, "ipfs://test");

        // Create vault
        royaltyVault.createVault(ipaId);

        // Pay royalty with USDC (6 decimals)
        vm.startPrank(user);
        usdc.approve(address(royaltyVault), 100 * 1e6);
        royaltyVault.payRoyalty(ipaId, address(usdc), 100 * 1e6);
        vm.stopPrank();

        // Verify balance
        uint256 balance = royaltyVault.getRoyaltyBalance(ipaId, address(usdc));
        assertEq(balance, 100 * 1e6, "Royalty balance should be 100 USDC");
    }

    function testPayRoyalty_VaultNotExist_Reverts() public {
        // Mint IP
        vm.prank(user);
        bytes32 ipaId = ipRegistry.mintIP(user, "ipfs://test");

        // Try to pay royalty without creating vault
        vm.startPrank(user);
        mockToken.approve(address(royaltyVault), 100 * 1e18);

        vm.expectRevert("Vault does not exist");
        royaltyVault.payRoyalty(ipaId, address(mockToken), 100 * 1e18);
        vm.stopPrank();
    }

    function testAutoRepay_USDC() public {
        // Setup AutoRepayEngine
        AutoRepayEngine engine = new AutoRepayEngine();
        AutonomyVault vault = new AutonomyVault(address(usdc));
        IPManager ipManager = new IPManager();
        MockUniswapRouter router = new MockUniswapRouter();

        // Configure contracts
        engine.setVault(address(vault));
        engine.setIPManager(address(ipManager));
        engine.setRouter(address(router));
        engine.setWETH(address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)); // Mock WETH
        engine.setRepayToken(address(usdc));
        engine.setWhitelistedToken(address(usdc), true);

        vault.setIPManager(address(ipManager));
        vault.setAutoRepayEngine(address(engine));

        ipManager.setVault(address(vault));
        ipManager.setAutoRepayEngine(address(engine));

        // Mint IP
        vm.prank(user);
        bytes32 ipaId = ipRegistry.mintIP(user, "ipfs://test");

        // Create vault and pay royalty (1000 USDC)
        royaltyVault.createVault(ipaId);
        vm.startPrank(user);
        usdc.approve(address(royaltyVault), 1000 * 1e6);
        royaltyVault.payRoyalty(ipaId, address(usdc), 1000 * 1e6);
        vm.stopPrank();

        // Lock IP
        vm.prank(user);
        ipManager.lockIPA(ipaId, user, 10000 * 1e18); // $10k collateral

        // Deposit collateral and borrow (create debt)
        vm.startPrank(user);
        usdc.approve(address(vault), 500 * 1e6);
        vault.depositCollateral(500 * 1e6);
        vault.borrow(200 * 1e6); // Borrow 200 USDC
        vm.stopPrank();

        // Verify debt
        IAutonomyVault.Position memory pos = vault.getPosition(user);
        assertEq(pos.debtAmount, 200 * 1e6, "Debt should be 200 USDC");

        // Claim Royalty
        vm.prank(user);
        royaltyVault.claimRoyalty(ipaId, user, address(usdc));

        // Auto Repay
        vm.startPrank(user);
        usdc.approve(address(engine), 1000 * 1e6);
        engine.autoRepayFromRoyalty(
            ipaId,
            address(usdc),
            200 * 1e6,
            0,
            0,
            address(0)
        ); // Repay 200 USDC
        vm.stopPrank();

        // Verify debt reduced
        pos = vault.getPosition(user);
        assertEq(pos.debtAmount, 0, "Debt should be 0");
    }
}
