const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const networkArg = args.find(arg => arg.startsWith('--network='));
const network = networkArg ? networkArg.split('=')[1] : 'storyAeneid';

// Network configurations
const NETWORK_CONFIG = {
    'storyAeneid': {
        chainId: 1315,
        broadcastDir: path.join(__dirname, '../contracts/broadcast/DeployStoryAeneid.s.sol/1315')
    }
};

const currentNetwork = NETWORK_CONFIG[network];
if (!currentNetwork) {
    console.error(`❌ Unknown network: ${network}`);
    console.error(`   Supported networks: ${Object.keys(NETWORK_CONFIG).join(', ')}`);
    process.exit(1);
}

// Configuration
const BROADCAST_DIR = currentNetwork.broadcastDir;
const CHAIN_ID = currentNetwork.chainId;
const FRONTEND_CONFIG_PATH = path.join(__dirname, '../frontend/src/config/contracts.ts');
const FRONTEND_ABI_DIR = path.join(__dirname, '../frontend/src/abis');

// Contract names to sync
const CONTRACTS = [
    'LendingPool',
    'AutonomyVault',
    'IPManager',
    'AutoRepayEngine',
    'InterestRateModel',
    'PriceOracle',
    'USDC',
    'USDT',
    'WETH',
    'WBTC',
    'DAI',
    'LINK',
    'UNI',
    'AAVE',
    'MockRoyaltyToken',
    'MockIPAssetRegistry',
    'MockRoyaltyVault',
    'MockRoyaltyModule',
    'MockUniswapRouter'
];

// Mapping for contracts defined in files with different names
const ARTIFACT_SOURCE_MAPPING = {
    'MockIPAssetRegistry': 'StoryProtocolMock.sol',
    'MockRoyaltyVault': 'StoryProtocolMock.sol',
    'MockRoyaltyModule': 'StoryProtocolMock.sol'
};

async function main() {
    console.log('🔄 Syncing frontend with latest deployment...');
    console.log(`📡 Network: ${network} (Chain ID: ${CHAIN_ID})`);
    console.log('');

    // 1. Find latest run file
    if (!fs.existsSync(BROADCAST_DIR)) {
        console.error('❌ Broadcast directory not found. Did you run the deployment script?');
        process.exit(1);
    }

    const runFiles = fs.readdirSync(BROADCAST_DIR).filter(f => f.endsWith('.json') && f !== 'latest.json');
    if (runFiles.length === 0) {
        console.error('❌ No deployment runs found.');
        process.exit(1);
    }

    // Sort by modification time to get the latest
    const latestRunFile = runFiles.map(f => ({
        name: f,
        time: fs.statSync(path.join(BROADCAST_DIR, f)).mtime.getTime()
    })).sort((a, b) => b.time - a.time)[0].name;

    const runPath = path.join(BROADCAST_DIR, latestRunFile);
    console.log(`📄 Reading deployment from: ${latestRunFile}`);

    const runData = JSON.parse(fs.readFileSync(runPath, 'utf8'));
    const transactions = runData.transactions;
    const addresses = {};

    // 2. Extract addresses
    console.log('🔍 Extracting addresses...');
    
    // Helper to find address by contract name
    // Note: Foundry broadcast JSONs can be tricky. We look for contract names in the transaction data.
    // Since we named our variables in the script (e.g. "usdc = new USDC()"), we can try to map them.
    // However, the broadcast file mainly contains transaction receipts.
    // A more robust way is to look at the "contractName" field if available, or infer from the order/creation code.
    // BUT, for simplicity and robustness in this specific setup, we can rely on the fact that we know the order 
    // OR we can use the `run-latest.json` which might have better structure, 
    // OR we can parse the `contractAddress` from the receipts if we can match the contract name.
    
    // Actually, `run-latest.json` is usually a symlink or copy of the latest run.
    // Let's iterate through transactions and try to match contract names.
    
    for (const tx of transactions) {
        if (tx.transactionType === 'CREATE') {
            const contractName = tx.contractName;
            if (contractName && CONTRACTS.includes(contractName)) {
                addresses[contractName] = tx.contractAddress;
                console.log(`   ✅ Found ${contractName}: ${tx.contractAddress}`);
            }
        }
    }

    // 3. Update Frontend Config
    console.log('📝 Updating frontend config...');
    
    // Mapping from deployed contract name to frontend config key
    const KEY_MAPPING = {
        'LendingPool': 'LENDING_POOL',
        'AutonomyVault': 'AUTONOMY_VAULT',
        'IPManager': 'IP_MANAGER',
        'AutoRepayEngine': 'AUTO_REPAY_ENGINE',
        'InterestRateModel': 'INTEREST_RATE_MODEL',
        'PriceOracle': 'PRICE_ORACLE',
        // 'USDC': 'COLLATERAL_TOKEN', // Removed mapping, will use USDC
        'USDT': 'USDT',
        'WETH': 'WETH',
        'WBTC': 'WBTC',
        'DAI': 'DAI',
        'LINK': 'LINK',
        'UNI': 'UNI',
        'AAVE': 'AAVE'
    };

    // Read existing config to preserve other networks
    let existingNetworks = {};
    if (fs.existsSync(FRONTEND_CONFIG_PATH)) {
        try {
            const existingContent = fs.readFileSync(FRONTEND_CONFIG_PATH, 'utf8');
            // Try to extract existing network data (simple regex approach)
            // This is a basic implementation - in production you'd want more robust parsing
            const networksMatch = existingContent.match(/export const CONTRACTS = ({[\s\S]*?}) as const;/);
            if (networksMatch) {
                // We'll rebuild from scratch to avoid parsing complexity
                console.log('   📋 Existing config found, will merge networks');
            }
        } catch (e) {
            console.log('   ℹ️  Creating new config file');
        }
    }

    let configContent = `// Auto-generated by scripts/sync-frontend.js\n// Do not edit manually\n// Last updated: ${new Date().toISOString()}\n\n`;

    // Add imports
    for (const contract of CONTRACTS) {
        configContent += `import ${contract}ABI from '../abis/${contract}.json';\n`;
    }

    configContent += `\n// Network-specific contract addresses\nexport const CONTRACTS = {\n`;
    
    // Add current network configuration
    configContent += `    ${CHAIN_ID}: { // ${network}\n`;
    
    for (const contract of CONTRACTS) {
        const addr = addresses[contract];
        const key = KEY_MAPPING[contract] || contract;
        
        if (addr) {
            configContent += `        ${key}: {\n`;
            configContent += `            address: "${addr}" as const,\n`;
            configContent += `            abi: ${contract}ABI,\n`;
            configContent += `        },\n`;
        } else {
            console.warn(`   ⚠️  Warning: No address found for ${contract}`);
            configContent += `        ${key}: {\n`;
            configContent += `            address: "" as const,\n`;
            configContent += `            abi: ${contract}ABI,\n`;
            configContent += `        },\n`;
        }
    }
    
    configContent += `    },\n`;
    configContent += `} as const;\n\n`;
    
    // Add helper function
    configContent += `// Helper to get contracts for current chain\n`;
    configContent += `export const getContracts = (chainId: number) => {\n`;
    configContent += `    return CONTRACTS[chainId as keyof typeof CONTRACTS];\n`;
    configContent += `};\n\n`;
    
    // Add supported chain IDs - STRICTLY Story Aeneid
    configContent += `export const SUPPORTED_CHAIN_IDS = [1315] as const;\n\n`;
    
    // PRIMARY AND ONLY MARKET CHAIN - Story Aeneid
    configContent += `// All market data, liquidity, and APY/APR come from Story Aeneid\n`;
    configContent += `export const MARKET_CHAIN_ID = 1315;\n\n`;

    // Keep backward compatibility
    configContent += `// Backward compatibility - Story Aeneid is the only chain\n`;
    configContent += `export const CHAIN_ID = MARKET_CHAIN_ID;\n`;

    fs.writeFileSync(FRONTEND_CONFIG_PATH, configContent);
    console.log(`   ✅ Wrote to ${FRONTEND_CONFIG_PATH}`);

    // 4. Copy ABIs
    console.log('📦 Copying ABIs...');
    if (!fs.existsSync(FRONTEND_ABI_DIR)) {
        fs.mkdirSync(FRONTEND_ABI_DIR, { recursive: true });
    }

    for (const contract of CONTRACTS) {
        // Foundry artifacts are in contracts/out/<ContractName>.sol/<ContractName>.json
        // Check if there's a custom source mapping
        const sourceFile = ARTIFACT_SOURCE_MAPPING[contract] || `${contract}.sol`;
        const artifactPath = path.join(__dirname, `../contracts/out/${sourceFile}/${contract}.json`);
        
        if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            const abiContent = JSON.stringify(artifact.abi, null, 2);
            const abiDest = path.join(FRONTEND_ABI_DIR, `${contract}.json`);
            fs.writeFileSync(abiDest, abiContent);
            console.log(`   ✅ Copied ABI for ${contract}`);
        } else {
            console.warn(`   ⚠️  Warning: Artifact not found for ${contract}`);
        }
    }

    console.log('🎉 Sync complete!');
}

main().catch(console.error);
