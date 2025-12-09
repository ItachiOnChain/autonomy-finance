// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LendingPool.sol";
import "../src/AutonomyVault.sol";
import "../src/IPManager.sol";
import "../src/story/AutoRepayEngine.sol";
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

/**
 * @title DeployStoryAeneid
 * @notice Deployment script for Story Aeneid Testnet
 * @dev This script deploys the entire Autonomy Finance protocol to Story Aeneid testnet
 *      with enhanced logging and error diagnostics.
 *
 * Network Details:
 * - Chain ID: 1315
 * - RPC URL: https://aeneid.storyrpc.io
 * - Currency: IP
 * - Explorer: https://aeneid.storyscan.io
 *
 * Environment Variables Required:
 * - STORY_RPC_URL: RPC endpoint for Story Aeneid
 * - STORY_PRIVATE_KEY: Deployer private key (DO NOT COMMIT)
 *
 * Usage:
 * forge script script/DeployStoryAeneid.s.sol:DeployStoryAeneid \
 *   --rpc-url $STORY_RPC_URL \
 *   --private-key $STORY_PRIVATE_KEY \
 *   --broadcast
 */
contract DeployStoryAeneid is Script {
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

    // Gas tracking
    uint256 private deploymentStartGas;
    uint256 private totalGasUsed;

    function run() external {
        // Pre-deployment checks
        console.log("================================================");
        console.log("   STORY AENEID TESTNET DEPLOYMENT");
        console.log("================================================");
        console.log("");
        console.log("Network: Story Aeneid Testnet");
        console.log("Chain ID: 1315");
        console.log("RPC URL: https://aeneid.storyrpc.io");
        console.log("Deployer:", msg.sender);
        console.log("");

        // Check deployer balance
        uint256 deployerBalance = msg.sender.balance;
        console.log("Deployer IP Balance:", deployerBalance / 1e18, "IP");

        if (deployerBalance < 0.1 ether) {
            console.log("");
            console.log("WARNING: Low IP balance!");
            console.log("Recommended: At least 0.5 IP for deployment");
            console.log("Get testnet IP from Story Aeneid faucet");
            console.log("");
        }

        console.log("================================================");
        console.log("");

        deploymentStartGas = gasleft();

        vm.startBroadcast();

        // 1. Deploy Mock Tokens
        _logDeploymentStart("Mock Tokens");
        usdc = new USDC();
        _logDeploymentSuccess("USDC", address(usdc));

        usdt = new USDT();
        _logDeploymentSuccess("USDT", address(usdt));

        weth = new WETH();
        _logDeploymentSuccess("WETH", address(weth));

        wbtc = new WBTC();
        _logDeploymentSuccess("WBTC", address(wbtc));

        dai = new DAI();
        _logDeploymentSuccess("DAI", address(dai));

        link = new LINK();
        _logDeploymentSuccess("LINK", address(link));

        uni = new UNI();
        _logDeploymentSuccess("UNI", address(uni));

        aave = new AAVE();
        _logDeploymentSuccess("AAVE", address(aave));
        console.log("");

        // 2. Deploy Price Oracle and set initial prices
        _logDeploymentStart("Price Oracle");
        priceOracle = new PriceOracle();
        _logDeploymentSuccess("PriceOracle", address(priceOracle));

        // Set initial prices (18 decimals)
        console.log("  Setting initial token prices...");
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
        console.log("  Prices configured for 8 assets");
        console.log("");

        // 3. Deploy Interest Rate Model
        _logDeploymentStart("Interest Rate Model");
        console.log(
            "  Base: 2%, Multiplier: 10%, Jump: 200%, Kink: 80%, Reserve: 10%"
        );
        interestRateModel = new InterestRateModel(
            200, // 2% base rate
            1000, // 10% multiplier
            20000, // 200% jump multiplier
            8000, // 80% kink
            1000 // 10% reserve factor
        );
        _logDeploymentSuccess("InterestRateModel", address(interestRateModel));
        console.log("");

        // 4. Deploy Lending Pool
        _logDeploymentStart("Lending Pool");
        console.log("  Constructor params:");
        console.log("    InterestRateModel:", address(interestRateModel));
        console.log("    PriceOracle:", address(priceOracle));

        lendingPool = new LendingPool(
            address(interestRateModel),
            address(priceOracle)
        );
        _logDeploymentSuccess("LendingPool", address(lendingPool));
        console.log("");

        // Initialize assets in Lending Pool
        console.log("  Initializing lending pool assets...");

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
        console.log("  Initialized 8 assets");
        console.log("");

        // 5. Deploy Autonomy System (Vault, IPManager, AutoRepayEngine)
        _logDeploymentStart("Autonomy Vault");
        console.log("  Constructor params:");
        console.log("    Primary collateral token:", address(usdc));
        vault = new AutonomyVault(address(usdc));
        _logDeploymentSuccess("AutonomyVault", address(vault));
        console.log("");

        _logDeploymentStart("IP Manager");
        ipManager = new IPManager();
        _logDeploymentSuccess("IPManager", address(ipManager));
        console.log("");

        _logDeploymentStart("Auto Repay Engine");
        autoRepayEngine = new AutoRepayEngine();
        _logDeploymentSuccess("AutoRepayEngine", address(autoRepayEngine));
        console.log("");

        // Wire dependencies
        console.log("  Wiring contract dependencies...");

        // Vault dependencies
        vault.setIPManager(address(ipManager));
        vault.setAutoRepayEngine(address(autoRepayEngine));
        console.log("    Vault -> IPManager, AutoRepayEngine");

        // IPManager dependencies
        ipManager.setVault(address(vault));
        ipManager.setAutoRepayEngine(address(autoRepayEngine));
        ipManager.setLendingPool(address(lendingPool)); // NEW: For hasActiveDebt check
        console.log("    IPManager -> Vault, AutoRepayEngine, LendingPool");

        // AutoRepayEngine dependencies
        autoRepayEngine.setVault(address(vault));
        autoRepayEngine.setIPManager(address(ipManager));
        console.log("    AutoRepayEngine -> Vault, IPManager");
        console.log("");

        // Configure LendingPool integration for AutoRepayEngine
        console.log("  Configuring LendingPool integration...");
        autoRepayEngine.setLendingPool(address(lendingPool));
        console.log("    AutoRepayEngine -> LendingPool");
        console.log("");

        // Add ALL supported assets for multi-asset debt scanning
        console.log("  Adding supported assets to AutoRepayEngine...");
        autoRepayEngine.addSupportedAsset(address(usdc));
        autoRepayEngine.addSupportedAsset(address(usdt));
        autoRepayEngine.addSupportedAsset(address(dai));
        autoRepayEngine.addSupportedAsset(address(weth));
        autoRepayEngine.addSupportedAsset(address(wbtc));
        autoRepayEngine.addSupportedAsset(address(link));
        autoRepayEngine.addSupportedAsset(address(uni));
        autoRepayEngine.addSupportedAsset(address(aave));
        console.log("    Added 8 supported assets");
        console.log("");

        // 6. Deploy Story Protocol Mocks
        _logDeploymentStart("Story Protocol Mocks");
        mockIPRegistry = new MockIPAssetRegistry();
        _logDeploymentSuccess("MockIPAssetRegistry", address(mockIPRegistry));

        mockRoyaltyVault = new MockRoyaltyVault();
        _logDeploymentSuccess("MockRoyaltyVault", address(mockRoyaltyVault));

        mockRoyaltyModule = new MockRoyaltyModule();
        _logDeploymentSuccess("MockRoyaltyModule", address(mockRoyaltyModule));
        console.log("");

        // NEW: Wire MockRoyaltyVault for automatic routing
        console.log("  Configuring automatic royalty routing...");
        mockRoyaltyVault.setIPManager(address(ipManager));
        mockRoyaltyVault.setAutoRepayEngine(address(autoRepayEngine));
        console.log("    MockRoyaltyVault -> IPManager, AutoRepayEngine");
        console.log("    [OK] Automatic royalty routing ENABLED!");
        console.log("");

        // 7. Deploy Mock Royalty Token
        _logDeploymentStart("Mock Royalty Token");
        mockRoyaltyToken = new MockRoyaltyToken();
        _logDeploymentSuccess("MockRoyaltyToken", address(mockRoyaltyToken));
        console.log("");

        // 8. Deploy Mock Uniswap Router
        _logDeploymentStart("Mock Uniswap Router");
        mockRouter = new MockUniswapRouter();
        _logDeploymentSuccess("MockUniswapRouter", address(mockRouter));
        console.log("");

        // 9. Configure AutoRepayEngine
        console.log("  Configuring AutoRepayEngine parameters...");
        autoRepayEngine.setRouter(address(mockRouter));
        autoRepayEngine.setWETH(address(weth));
        autoRepayEngine.setRepayToken(address(usdc));
        autoRepayEngine.setTreasury(msg.sender);
        console.log("    Router, WETH, RepayToken, Treasury configured");
        console.log("");

        // Whitelist all tokens for auto-repay
        console.log("  Whitelisting tokens for auto-repay...");
        autoRepayEngine.setWhitelistedToken(address(usdc), true);
        autoRepayEngine.setWhitelistedToken(address(usdt), true);
        autoRepayEngine.setWhitelistedToken(address(weth), true);
        autoRepayEngine.setWhitelistedToken(address(wbtc), true);
        autoRepayEngine.setWhitelistedToken(address(dai), true);
        autoRepayEngine.setWhitelistedToken(address(link), true);
        autoRepayEngine.setWhitelistedToken(address(uni), true);
        autoRepayEngine.setWhitelistedToken(address(aave), true);
        autoRepayEngine.setWhitelistedToken(address(mockRoyaltyToken), true);
        console.log("    Whitelisted 9 tokens");
        console.log("");

        // Set conversion fee (10 bps = 0.1%)
        autoRepayEngine.setConversionFee(10);
        console.log("    Conversion fee: 0.1%");
        console.log("");

        // 10. Configure Mock Router Exchange Rates
        console.log("  Configuring router exchange rates...");

        // MockRoyaltyToken to ALL supported assets (direct paths)
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(usdc),
            1e18
        );
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(usdt),
            1e18
        );
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(dai),
            1e18
        );
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(weth),
            1e18
        );
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(wbtc),
            1e18
        );
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(link),
            1e18
        );
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(uni),
            1e18
        );
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(aave),
            1e18
        );

        // Cross-Stablecoin rates (bidirectional)
        mockRouter.setExchangeRate(address(usdc), address(usdt), 1e18);
        mockRouter.setExchangeRate(address(usdt), address(usdc), 1e18);
        mockRouter.setExchangeRate(address(usdc), address(dai), 1e18);
        mockRouter.setExchangeRate(address(dai), address(usdc), 1e18);
        mockRouter.setExchangeRate(address(usdt), address(dai), 1e18);
        mockRouter.setExchangeRate(address(dai), address(usdt), 1e18);

        // WETH as routing hub
        mockRouter.setExchangeRate(
            address(mockRoyaltyToken),
            address(weth),
            1e15
        );
        mockRouter.setExchangeRate(
            address(weth),
            address(mockRoyaltyToken),
            1000e18
        );

        // WETH -> Stablecoins
        mockRouter.setExchangeRate(address(weth), address(usdc), 3000e18);
        mockRouter.setExchangeRate(address(weth), address(usdt), 3000e18);
        mockRouter.setExchangeRate(address(weth), address(dai), 3000e18);

        // Stablecoins -> WETH
        mockRouter.setExchangeRate(
            address(usdc),
            address(weth),
            333333333333333
        );
        mockRouter.setExchangeRate(
            address(usdt),
            address(weth),
            333333333333333
        );
        mockRouter.setExchangeRate(
            address(dai),
            address(weth),
            333333333333333
        );

        // WETH <-> Other volatile assets
        mockRouter.setExchangeRate(
            address(weth),
            address(wbtc),
            50000000000000000
        );
        mockRouter.setExchangeRate(address(wbtc), address(weth), 20e18);
        mockRouter.setExchangeRate(address(weth), address(link), 200e18);
        mockRouter.setExchangeRate(
            address(link),
            address(weth),
            5000000000000000
        );
        mockRouter.setExchangeRate(address(weth), address(uni), 300e18);
        mockRouter.setExchangeRate(
            address(uni),
            address(weth),
            3333333333333333
        );
        mockRouter.setExchangeRate(address(weth), address(aave), 30e18);
        mockRouter.setExchangeRate(
            address(aave),
            address(weth),
            33333333333333333
        );

        // Volatile assets to stablecoins (direct)
        mockRouter.setExchangeRate(address(wbtc), address(usdc), 60000e18);
        mockRouter.setExchangeRate(address(wbtc), address(usdt), 60000e18);
        mockRouter.setExchangeRate(address(wbtc), address(dai), 60000e18);
        mockRouter.setExchangeRate(address(link), address(usdc), 15e18);
        mockRouter.setExchangeRate(address(link), address(usdt), 15e18);
        mockRouter.setExchangeRate(address(link), address(dai), 15e18);
        mockRouter.setExchangeRate(address(uni), address(usdc), 10e18);
        mockRouter.setExchangeRate(address(uni), address(usdt), 10e18);
        mockRouter.setExchangeRate(address(uni), address(dai), 10e18);
        mockRouter.setExchangeRate(address(aave), address(usdc), 100e18);
        mockRouter.setExchangeRate(address(aave), address(usdt), 100e18);
        mockRouter.setExchangeRate(address(aave), address(dai), 100e18);

        console.log("    Configured all swap paths");
        console.log("");

        // Set slippage to 0.5%
        mockRouter.setSimulatedSlippage(50);
        console.log("    Slippage: 0.5%");
        console.log("");

        // 11. Mint liquidity tokens to router for swaps
        console.log("  Minting liquidity to router...");
        mockRoyaltyToken.mint(address(mockRouter), 10_000_000 * 1e18);
        usdc.mint(address(mockRouter), 10_000_000 * 1e6);
        usdt.mint(address(mockRouter), 10_000_000 * 1e6);
        weth.mint(address(mockRouter), 10_000 * 1e18);
        wbtc.mint(address(mockRouter), 100 * 1e8);
        dai.mint(address(mockRouter), 10_000_000 * 1e18);
        link.mint(address(mockRouter), 1_000_000 * 1e18);
        uni.mint(address(mockRouter), 1_000_000 * 1e18);
        aave.mint(address(mockRouter), 100_000 * 1e18);
        console.log("    Minted liquidity for 9 tokens");
        console.log("");

        // 12. Seed Initial Liquidity for All Tokens
        console.log("  Seeding initial liquidity to lending pool...");

        // Define seed amounts
        uint256 seedWETH = 100 ether;
        uint256 seedUSDC = 100_000 * 1e6;
        uint256 seedUSDT = 100_000 * 1e6;
        uint256 seedDAI = 100_000 ether;
        uint256 seedWBTC = 10 * 1e8;
        uint256 seedLINK = 10_000 ether;
        uint256 seedUNI = 10_000 ether;
        uint256 seedAAVE = 1_000 ether;

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

        console.log("    Seeded liquidity for 8 tokens");
        console.log("");

        // Mint test tokens to deployer
        console.log("  Minting test tokens to deployer...");
        mockRoyaltyToken.mint(msg.sender, 100_000 * 1e18);
        console.log("    Minted 100,000 MockRoyaltyToken");
        console.log("");

        // 13. Configure E-Mode Categories
        console.log("  Configuring E-Mode categories...");

        // Category 1: Stablecoins - 97% LTV
        lendingPool.setEModeCategory(1, 9700, 9800, 10100, "Stablecoins");

        // Category 2: ETH Derivatives - 90% LTV
        lendingPool.setEModeCategory(2, 9000, 9300, 10500, "ETH");

        // Category 3: BTC Derivatives - 90% LTV
        lendingPool.setEModeCategory(3, 9000, 9300, 10500, "BTC");

        // Set asset categories
        lendingPool.setAssetCategory(address(usdc), 1);
        lendingPool.setAssetCategory(address(usdt), 1);
        lendingPool.setAssetCategory(address(dai), 1);
        lendingPool.setAssetCategory(address(weth), 2);
        lendingPool.setAssetCategory(address(wbtc), 3);

        console.log("    Configured 3 E-Mode categories");
        console.log("");

        vm.stopBroadcast();

        // Calculate total gas used
        totalGasUsed = deploymentStartGas - gasleft();

        // Final deployment summary
        _printDeploymentSummary();
    }

    /**
     * @dev Log the start of a deployment step
     */
    function _logDeploymentStart(string memory contractName) private pure {
        console.log("Deploying", contractName, "...");
    }

    /**
     * @dev Log successful deployment with address
     */
    function _logDeploymentSuccess(
        string memory contractName,
        address contractAddress
    ) private pure {
        console.log("  ", contractName, "deployed at:", contractAddress);
    }

    /**
     * @dev Print comprehensive deployment summary
     */
    function _printDeploymentSummary() private view {
        console.log("");
        console.log("================================================");
        console.log("        DEPLOYMENT COMPLETE - STORY AENEID");
        console.log("================================================");
        console.log("");
        console.log("NETWORK INFO:");
        console.log("  Chain ID:          1315");
        console.log("  Network:           Story Aeneid Testnet");
        console.log("  Explorer:          https://aeneid.storyscan.io");
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
        console.log("MOCKS (Story Protocol \u0026 DEX):");
        console.log("  MockRoyaltyToken:  ", address(mockRoyaltyToken));
        console.log("  MockIPRegistry:    ", address(mockIPRegistry));
        console.log("  MockRoyaltyVault:  ", address(mockRoyaltyVault));
        console.log("  MockRoyaltyModule: ", address(mockRoyaltyModule));
        console.log("  MockRouter:        ", address(mockRouter));
        console.log("");
        console.log("CONFIGURATION:");
        console.log("  Supported Assets:   8 tokens");
        console.log("  E-Mode Categories:  3 (Stablecoins, ETH, BTC)");
        console.log("  Swap Paths:         Fully configured");
        console.log("  Initial Liquidity:  Seeded for all assets");
        console.log("");
        console.log("NEXT STEPS:");
        console.log("  1. Verify contracts on explorer:");
        console.log("     https://aeneid.storyscan.io");
        console.log("");
        console.log("  2. Sync frontend with new addresses:");
        console.log("     node scripts/sync-frontend.js --network storyAeneid");
        console.log("");
        console.log("  3. Update frontend to connect to Story Aeneid");
        console.log("     Chain ID: 1315");
        console.log("     RPC: https://aeneid.storyrpc.io");
        console.log("");
        console.log("================================================");
        console.log("");
        console.log("TROUBLESHOOTING:");
        console.log("  If deployment failed, check:");
        console.log("  - Deployer has sufficient IP balance");
        console.log("  - RPC endpoint is accessible");
        console.log("  - No rate limiting from RPC provider");
        console.log("  - Constructor parameters are correct");
        console.log("================================================");
        console.log("");
    }
}
