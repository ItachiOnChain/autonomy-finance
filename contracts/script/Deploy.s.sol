// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LendingPool.sol";
import "../src/AutonomyVault.sol";
import "../src/IPManager.sol";
import "../src/AutoRepayEngine.sol";
import "../src/InterestRateModel.sol";
import "../src/PriceOracle.sol";
import "../src/tokens/USDC.sol";
import "../src/tokens/USDT.sol";
import "../src/tokens/WETH.sol";
import "../src/tokens/WBTC.sol";
import "../src/tokens/DAI.sol";
import "../src/tokens/LINK.sol";
import "../src/tokens/UNI.sol";
import "../src/tokens/AAVE.sol";
import "../src/tokens/MockRoyaltyToken.sol";
import "../src/dev/StoryProtocolMock.sol";
import "../src/dev/MockUniswapRouter.sol";

contract DeployScript is Script {
    // Contract instances
    LendingPool public lendingPool;
    AutonomyVault public vault;
    IPManager public ipManager;
    AutoRepayEngine public autoRepayEngine;
    InterestRateModel public interestRateModel;
    PriceOracle public priceOracle;

    // Token instances
    USDC public usdc;
    USDT public usdt;
    WETH public weth;
    WBTC public wbtc;
    DAI public dai;
    LINK public link;
    UNI public uni;
    AAVE public aave;
    MockRoyaltyToken public mockRoyaltyToken;

    // Story Protocol Mocks
    MockIPAssetRegistry public mockIPRegistry;
    MockRoyaltyVault public mockRoyaltyVault;
    MockRoyaltyModule public mockRoyaltyModule;

    // Mock Router
    MockUniswapRouter public mockRouter;

    // Constants
    uint256 constant BASIS_POINTS = 10000;

    function run() external {
        vm.startBroadcast();

        // 1. Deploy Mock Tokens
        console.log("Deploying Mock Tokens...");
        usdc = new USDC();
        usdt = new USDT();
        weth = new WETH();
        wbtc = new WBTC();
        dai = new DAI();
        link = new LINK();
        uni = new UNI();
        aave = new AAVE();

        // 2. Deploy Price Oracle and set initial prices
        console.log("Deploying Price Oracle...");
        priceOracle = new PriceOracle();

        // Set initial prices (18 decimals)
        // USDC = $1, USDT = $1, DAI = $1
        // WETH = $3000, WBTC = $60000, LINK = $15, UNI = $10, AAVE = $100
        address[] memory assets = new address[](8);
        uint256[] memory prices = new uint256[](8);

        assets[0] = address(usdc);
        prices[0] = 1e18;
        assets[1] = address(usdt);
        prices[1] = 1e18;
        assets[2] = address(weth);
        prices[2] = 3000e18;
        assets[3] = address(wbtc);
        prices[3] = 60000e18;
        assets[4] = address(dai);
        prices[4] = 1e18;
        assets[5] = address(link);
        prices[5] = 15e18;
        assets[6] = address(uni);
        prices[6] = 10e18;
        assets[7] = address(aave);
        prices[7] = 100e18;

        priceOracle.setPrices(assets, prices);

        // 3. Deploy Interest Rate Model
        console.log("Deploying Interest Rate Model...");
        // Base: 2%, Multiplier: 10%, Jump: 200%, Kink: 80%, Reserve: 10%
        interestRateModel = new InterestRateModel(
            200, // 2% base rate
            1000, // 10% multiplier
            20000, // 200% jump multiplier
            8000, // 80% kink
            1000 // 10% reserve factor
        );

        // 4. Deploy Lending Pool
        console.log("Deploying Lending Pool...");
        lendingPool = new LendingPool(
            address(interestRateModel),
            address(priceOracle)
        );

        // Initialize assets in Lending Pool
        // canBeCollateral, maxLTV, liquidationThreshold, liquidationBonus

        // Stablecoins: High LTV (80%), Low Bonus (5%)
        lendingPool.initializeAsset(address(usdc), true, 8000, 8500, 10500);
        lendingPool.initializeAsset(address(usdt), true, 8000, 8500, 10500);
        lendingPool.initializeAsset(address(dai), true, 8000, 8500, 10500);

        // Volatile Assets: Lower LTV (70-75%), Higher Bonus (10%)
        lendingPool.initializeAsset(address(weth), true, 7500, 8000, 11000);
        lendingPool.initializeAsset(address(wbtc), true, 7500, 8000, 11000);
        lendingPool.initializeAsset(address(link), true, 7000, 7500, 11000);
        lendingPool.initializeAsset(address(uni), true, 7000, 7500, 11000);
        lendingPool.initializeAsset(address(aave), true, 7000, 7500, 11000);

        // 5. Deploy Autonomy System (Vault, IPManager, AutoRepayEngine)
        console.log("Deploying Autonomy System...");

        // Deploy contracts
        vault = new AutonomyVault(address(usdc)); // USDC as primary collateral
        ipManager = new IPManager();
        autoRepayEngine = new AutoRepayEngine();

        // Wire dependencies
        console.log("Wiring dependencies...");

        // Vault dependencies
        vault.setIPManager(address(ipManager));
        vault.setAutoRepayEngine(address(autoRepayEngine));

        // IPManager dependencies
        ipManager.setVault(address(vault));
        ipManager.setAutoRepayEngine(address(autoRepayEngine));
        ipManager.setLendingPool(address(lendingPool)); // NEW: For hasActiveDebt check

        // AutoRepayEngine dependencies
        autoRepayEngine.setVault(address(vault));
        autoRepayEngine.setIPManager(address(ipManager));

        // CRITICAL: Configure LendingPool integration for AutoRepayEngine
        console.log("Configuring LendingPool integration...");
        autoRepayEngine.setLendingPool(address(lendingPool));

        // Add ALL supported assets for multi-asset debt scanning
        console.log("Adding supported assets to AutoRepayEngine...");
        autoRepayEngine.addSupportedAsset(address(usdc));
        autoRepayEngine.addSupportedAsset(address(usdt));
        autoRepayEngine.addSupportedAsset(address(dai));
        autoRepayEngine.addSupportedAsset(address(weth));
        autoRepayEngine.addSupportedAsset(address(wbtc));
        autoRepayEngine.addSupportedAsset(address(link));
        autoRepayEngine.addSupportedAsset(address(uni));
        autoRepayEngine.addSupportedAsset(address(aave));
        console.log(
            "Multi-asset support configured - AutoRepayEngine can now scan ALL assets!"
        );

        // 6. Deploy Story Protocol Mocks
        console.log("Deploying Story Protocol Mocks...");
        mockIPRegistry = new MockIPAssetRegistry();
        mockRoyaltyVault = new MockRoyaltyVault();
        mockRoyaltyModule = new MockRoyaltyModule();

        // NEW: Wire MockRoyaltyVault for automatic routing
        console.log("Configuring automatic royalty routing...");
        mockRoyaltyVault.setIPManager(address(ipManager));
        mockRoyaltyVault.setAutoRepayEngine(address(autoRepayEngine));
        console.log("Automatic royalty routing enabled!");

        // 7. Deploy Mock Royalty Token
        console.log("Deploying Mock Royalty Token...");
        mockRoyaltyToken = new MockRoyaltyToken();

        // 8. Deploy Mock Uniswap Router
        console.log("Deploying Mock Uniswap Router...");
        mockRouter = new MockUniswapRouter();

        // 9. Configure AutoRepayEngine
        console.log("Configuring AutoRepayEngine...");
        autoRepayEngine.setRouter(address(mockRouter));
        autoRepayEngine.setWETH(address(weth));
        autoRepayEngine.setRepayToken(address(usdc));
        autoRepayEngine.setTreasury(msg.sender); // Use deployer as treasury for testing

        // Whitelist all tokens for auto-repay
        autoRepayEngine.setWhitelistedToken(address(usdc), true);
        autoRepayEngine.setWhitelistedToken(address(usdt), true);
        autoRepayEngine.setWhitelistedToken(address(weth), true);
        autoRepayEngine.setWhitelistedToken(address(wbtc), true);
        autoRepayEngine.setWhitelistedToken(address(dai), true);
        autoRepayEngine.setWhitelistedToken(address(link), true);
        autoRepayEngine.setWhitelistedToken(address(uni), true);
        autoRepayEngine.setWhitelistedToken(address(aave), true);
        autoRepayEngine.setWhitelistedToken(address(mockRoyaltyToken), true);

        // Set conversion fee (10 bps = 0.1%)
        autoRepayEngine.setConversionFee(10);

        // 10. Configure Mock Router Exchange Rates - COMPREHENSIVE FIX
        console.log("Configuring router exchange rates (COMPREHENSIVE)...");

        // ===================================================================
        // CRITICAL FIX: Configure ALL necessary swap paths
        // ===================================================================

        // --- MockRoyaltyToken to ALL supported assets (direct paths) ---
        console.log("Setting MockRoyaltyToken -> Asset rates...");
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(usdc),
            1e18
        ); // 1:1
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(usdt),
            1e18
        ); // 1:1
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(dai),
            1e18
        ); // 1:1
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(weth),
            1e18
        ); // 1:1 for simplicity
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(wbtc),
            1e18
        ); // 1:1 for simplicity
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(link),
            1e18
        ); // 1:1 for simplicity
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(uni),
            1e18
        ); // 1:1 for simplicity
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(aave),
            1e18
        ); // 1:1 for simplicity

        // --- Cross-Stablecoin rates (bidirectional) ---
        console.log("Setting stablecoin cross-rates...");
        // USDC <-> USDT
        mockRouter.setExchangeRate(address(usdc), address(usdt), 1e18);
        mockRouter.setExchangeRate(address(usdt), address(usdc), 1e18);

        // USDC <-> DAI
        mockRouter.setExchangeRate(address(usdc), address(dai), 1e18);
        mockRouter.setExchangeRate(address(dai), address(usdc), 1e18);

        // USDT <-> DAI
        mockRouter.setExchangeRate(address(usdt), address(dai), 1e18);
        mockRouter.setExchangeRate(address(dai), address(usdt), 1e18);

        // --- WETH as routing hub (for 3-hop swaps) ---
        console.log("Setting WETH routing rates...");

        // MockRoyaltyToken <-> WETH
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(weth),
            1e15
        ); // 1 MRT = 0.001 WETH
        mockRouter.setExchangeRate(
            address(weth),
            address(mockRoyaltyToken),
            1000e18
        ); // 1 WETH = 1000 MRT

        // WETH -> Stablecoins (based on $3000 WETH price)
        mockRouter.setExchangeRate(address(weth), address(usdc), 3000e18); // 1 WETH = 3000 USDC
        mockRouter.setExchangeRate(address(weth), address(usdt), 3000e18); // 1 WETH = 3000 USDT
        mockRouter.setExchangeRate(address(weth), address(dai), 3000e18); // 1 WETH = 3000 DAI

        // Stablecoins -> WETH (reverse) - FIXED: Use integer approximations
        mockRouter.setExchangeRate(
            address(usdc),
            address(weth),
            333333333333333
        ); // ~1/3000 WETH per USDC
        mockRouter.setExchangeRate(
            address(usdt),
            address(weth),
            333333333333333
        ); // ~1/3000 WETH per USDT
        mockRouter.setExchangeRate(
            address(dai),
            address(weth),
            333333333333333
        ); // ~1/3000 WETH per DAI

        // WETH <-> Other volatile assets
        mockRouter.setExchangeRate(
            address(weth),
            address(wbtc),
            50000000000000000
        ); // 0.05 WETH per WBTC
        mockRouter.setExchangeRate(address(wbtc), address(weth), 20e18); // 1 WBTC = 20 WETH
        mockRouter.setExchangeRate(address(weth), address(link), 200e18); // 1 WETH = 200 LINK
        mockRouter.setExchangeRate(
            address(link),
            address(weth),
            5000000000000000
        ); // 1 LINK = 0.005 WETH
        mockRouter.setExchangeRate(address(weth), address(uni), 300e18); // 1 WETH = 300 UNI
        mockRouter.setExchangeRate(
            address(uni),
            address(weth),
            3333333333333333
        ); // ~1/300 WETH per UNI
        mockRouter.setExchangeRate(address(weth), address(aave), 30e18); // 1 WETH = 30 AAVE
        mockRouter.setExchangeRate(
            address(aave),
            address(weth),
            33333333333333333
        ); // ~1/30 WETH per AAVE

        // --- Volatile assets to stablecoins (direct, for efficiency) ---
        console.log("Setting volatile -> stablecoin rates...");
        mockRouter.setExchangeRate(address(wbtc), address(usdc), 60000e18); // 1 WBTC = 60000 USDC
        mockRouter.setExchangeRate(address(wbtc), address(usdt), 60000e18); // 1 WBTC = 60000 USDT
        mockRouter.setExchangeRate(address(wbtc), address(dai), 60000e18); // 1 WBTC = 60000 DAI

        mockRouter.setExchangeRate(address(link), address(usdc), 15e18); // 1 LINK = 15 USDC
        mockRouter.setExchangeRate(address(link), address(usdt), 15e18); // 1 LINK = 15 USDT
        mockRouter.setExchangeRate(address(link), address(dai), 15e18); // 1 LINK = 15 DAI

        mockRouter.setExchangeRate(address(uni), address(usdc), 10e18); // 1 UNI = 10 USDC
        mockRouter.setExchangeRate(address(uni), address(usdt), 10e18); // 1 UNI = 10 USDT
        mockRouter.setExchangeRate(address(uni), address(dai), 10e18); // 1 UNI = 10 DAI

        mockRouter.setExchangeRate(address(aave), address(usdc), 100e18); // 1 AAVE = 100 USDC
        mockRouter.setExchangeRate(address(aave), address(usdt), 100e18); // 1 AAVE = 100 USDT
        mockRouter.setExchangeRate(address(aave), address(dai), 100e18); // 1 AAVE = 100 DAI

        console.log("Exchange rates configured - ALL swap paths enabled!");

        // Set slippage to 0.5%
        mockRouter.setSimulatedSlippage(50);

        // 11. Mint liquidity tokens to router for swaps
        console.log("Minting liquidity to router...");
        mockRoyaltyToken.mint(address(mockRouter), 10_000_000 * 1e18);
        usdc.mint(address(mockRouter), 10_000_000 * 1e6);
        usdt.mint(address(mockRouter), 10_000_000 * 1e6);
        weth.mint(address(mockRouter), 10_000 * 1e18);
        wbtc.mint(address(mockRouter), 100 * 1e8);
        dai.mint(address(mockRouter), 10_000_000 * 1e18);
        link.mint(address(mockRouter), 1_000_000 * 1e18);
        uni.mint(address(mockRouter), 1_000_000 * 1e18);
        aave.mint(address(mockRouter), 100_000 * 1e18);

        // 12. Seed Initial Liquidity for All Tokens
        console.log("Seeding initial liquidity...");

        // Define seed amounts (in token's native decimals)
        uint256 seedWETH = 100 ether; // 100 WETH
        uint256 seedUSDC = 100_000 * 1e6; // 100,000 USDC (6 decimals)
        uint256 seedUSDT = 100_000 * 1e6; // 100,000 USDT (6 decimals)
        uint256 seedDAI = 100_000 ether; // 100,000 DAI (18 decimals)
        uint256 seedWBTC = 10 * 1e8; // 10 WBTC (8 decimals)
        uint256 seedLINK = 10_000 ether; // 10,000 LINK
        uint256 seedUNI = 10_000 ether; // 10,000 UNI
        uint256 seedAAVE = 1_000 ether; // 1,000 AAVE

        // Mint tokens to deployer
        usdc.mint(msg.sender, seedUSDC);
        usdt.mint(msg.sender, seedUSDT);
        weth.mint(msg.sender, seedWETH);
        wbtc.mint(msg.sender, seedWBTC);
        dai.mint(msg.sender, seedDAI);
        link.mint(msg.sender, seedLINK);
        uni.mint(msg.sender, seedUNI);
        aave.mint(msg.sender, seedAAVE);

        // Approve lending pool
        usdc.approve(address(lendingPool), seedUSDC);
        usdt.approve(address(lendingPool), seedUSDT);
        weth.approve(address(lendingPool), seedWETH);
        wbtc.approve(address(lendingPool), seedWBTC);
        dai.approve(address(lendingPool), seedDAI);
        link.approve(address(lendingPool), seedLINK);
        uni.approve(address(lendingPool), seedUNI);
        aave.approve(address(lendingPool), seedAAVE);

        // Seed liquidity
        lendingPool.seedLiquidity(address(usdc), seedUSDC);
        lendingPool.seedLiquidity(address(usdt), seedUSDT);
        lendingPool.seedLiquidity(address(weth), seedWETH);
        lendingPool.seedLiquidity(address(wbtc), seedWBTC);
        lendingPool.seedLiquidity(address(dai), seedDAI);
        lendingPool.seedLiquidity(address(link), seedLINK);
        lendingPool.seedLiquidity(address(uni), seedUNI);
        lendingPool.seedLiquidity(address(aave), seedAAVE);

        console.log("Seeded liquidity for all tokens!");

        // Mint test tokens to deployer for testing
        console.log("Minting test tokens to deployer...");
        mockRoyaltyToken.mint(msg.sender, 100_000 * 1e18);

        // Mint test tokens to default Anvil account for frontend testing
        address testUser = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        usdc.mint(testUser, 10_000 * 1e6);
        usdt.mint(testUser, 10_000 * 1e6);
        weth.mint(testUser, 10 ether);
        wbtc.mint(testUser, 1 * 1e8);
        dai.mint(testUser, 10_000 ether);
        mockRoyaltyToken.mint(testUser, 10_000 * 1e18);

        // 13. Configure E-Mode Categories
        console.log("Configuring E-Mode categories...");

        // Category 1: Stablecoins (USDC, USDT, DAI) - 97% LTV
        lendingPool.setEModeCategory(
            1, // categoryId
            9700, // 97% LTV
            9800, // 98% liquidation threshold
            10100, // 1% liquidation bonus
            "Stablecoins"
        );

        // Category 2: ETH Derivatives (WETH) - 90% LTV
        lendingPool.setEModeCategory(
            2,
            9000, // 90% LTV
            9300, // 93% liquidation threshold
            10500, // 5% liquidation bonus
            "ETH"
        );

        // Category 3: BTC Derivatives (WBTC) - 90% LTV
        lendingPool.setEModeCategory(
            3,
            9000, // 90% LTV
            9300, // 93% liquidation threshold
            10500, // 5% liquidation bonus
            "BTC"
        );

        // Set asset categories
        lendingPool.setAssetCategory(address(usdc), 1); // Stablecoins
        lendingPool.setAssetCategory(address(usdt), 1); // Stablecoins
        lendingPool.setAssetCategory(address(dai), 1); // Stablecoins
        lendingPool.setAssetCategory(address(weth), 2); // ETH
        lendingPool.setAssetCategory(address(wbtc), 3); // BTC
        // LINK, UNI, AAVE remain category 0 (no E-Mode benefit)

        console.log("E-Mode categories configured!");

        // 14. Log Deployments
        console.log("");
        console.log("=================================================");
        console.log("           DEPLOYMENT COMPLETE                   ");
        console.log("=================================================");
        console.log("");
        console.log("TOKENS:");
        console.log("  USDC:              ", address(usdc));
        console.log("  USDT:              ", address(usdt));
        console.log("  WETH:              ", address(weth));
        console.log("  WBTC:              ", address(wbtc));
        console.log("  DAI:               ", address(dai));
        console.log("  LINK:              ", address(link));
        console.log("  UNI:               ", address(uni));
        console.log("  AAVE:              ", address(aave));
        console.log("");
        console.log("CORE CONTRACTS:");
        console.log("  PriceOracle:       ", address(priceOracle));
        console.log("  InterestRateModel: ", address(interestRateModel));
        console.log("  LendingPool:       ", address(lendingPool));
        console.log("");
        console.log("AUTONOMY SYSTEM:");
        console.log("  AutonomyVault:     ", address(vault));
        console.log("  IPManager:         ", address(ipManager));
        console.log("  AutoRepayEngine:   ", address(autoRepayEngine));
        console.log("");
        console.log("MULTI-ASSET SUPPORT:");
        console.log(
            "  Supported Assets:   8 tokens (USDC, USDT, DAI, WETH, WBTC, LINK, UNI, AAVE)"
        );
        console.log("  Auto-Repay Mode:    Scans ALL assets to find user debt");
        console.log(
            "  Swap Paths:         FULLY CONFIGURED - All token pairs supported!"
        );
        console.log("");
        console.log("MOCKS:");
        console.log("  MockRoyaltyToken:  ", address(mockRoyaltyToken));
        console.log("  MockIPRegistry:    ", address(mockIPRegistry));
        console.log("  MockRoyaltyVault:  ", address(mockRoyaltyVault));
        console.log("  MockRoyaltyModule: ", address(mockRoyaltyModule));
        console.log("  MockRouter:        ", address(mockRouter));
        console.log("=================================================");
        console.log("");
        console.log("FIXES APPLIED:");
        console.log("  - Fixed division errors: Using integer approximations");
        console.log("  - MockRoyaltyToken -> ALL assets (direct paths)");
        console.log("  - Cross-stablecoin rates (USDC/USDT/DAI bidirectional)");
        console.log("  - WETH routing hub for 3-hop swaps");
        console.log("  - Volatile assets -> stablecoins (direct paths)");
        console.log("  - ALL swap combinations now supported!");
        console.log("=================================================");
        console.log("");

        vm.stopBroadcast();
    }
}
