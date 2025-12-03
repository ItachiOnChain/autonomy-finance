const { execSync } = require('child_process');

// Configuration
const RPC_URL = "http://localhost:8545";
const DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Anvil #0
const USER_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // Anvil #1
const USER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// Contract Addresses
const USDC = "0xdb54fa574a3e8c6ac784e1a5cdb575a737622cff";
const MOCK_ROYALTY = "0x15ff10fcc8a1a50bfbe07847a22664801ea79e0f";
const IP_MANAGER = "0x398e4948e373db819606a459456176d31c3b1f91";
const AUTO_REPAY = "0xbe18a1b61ceaf59aeb6a9bc81ab4fb87d56ba167";
const MOCK_REGISTRY = "0x09120eaed8e4cd86d85a616680151daa653880f2";
const VAULT = "0xfcfe742e19790dd67a627875ef8b45f17db1dac6";

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        console.error(e.stderr);
        throw e;
    }
}

async function main() {
    console.log("🚀 Starting Auto-Repay Debug Flow (Node.js)...");

    // 0. Create Debt (Deposit USDC -> Borrow USDC)
    console.log("0️⃣  Creating Debt Position...");
    // Mint 1000 USDC to user (using DEPLOYER_KEY)
    // USDC has 6 decimals? Let's check. Usually 6.
    // Assuming 6 decimals: 1000 * 1e6 = 1000000000
    const amountUSDC = "1000000000"; 
    run(`cast send ${USDC} "mint(address,uint256)" ${USER_ADDRESS} ${amountUSDC} --private-key ${DEPLOYER_KEY} --rpc-url ${RPC_URL}`);
    
    // Approve Vault
    run(`cast send ${USDC} "approve(address,uint256)" ${VAULT} ${amountUSDC} --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    
    // Deposit 500 USDC
    const depositAmount = "500000000";
    run(`cast send ${VAULT} "depositCollateral(uint256)" ${depositAmount} --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    
    // Borrow 100 USDC
    const borrowAmount = "100000000";
    run(`cast send ${VAULT} "borrow(uint256)" ${borrowAmount} --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    console.log("   Debt created: 100 USDC");

    // Check if user already has a locked IP
    console.log("🔍 Checking for existing locked IP...");
    const existingIPA = run(`cast call ${IP_MANAGER} "userIPA(address)(bytes32)" ${USER_ADDRESS} --rpc-url ${RPC_URL}`);
    
    let ipaId;
    if (existingIPA !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log(`   Found existing locked IP: ${existingIPA}`);
        ipaId = existingIPA;
    } else {
        // 1. Mint IP
        console.log("1️⃣  Minting new IP Asset...");
        const mintJson = run(`cast send ${MOCK_REGISTRY} "mintIP(address,string)" ${USER_ADDRESS} "ipfs://test" --private-key ${USER_KEY} --rpc-url ${RPC_URL} --json`);
        const mintTx = JSON.parse(mintJson).transactionHash;
        console.log(`   Tx: ${mintTx}`);

        const receiptJson = run(`cast receipt ${mintTx} --rpc-url ${RPC_URL} --json`);
        const logs = JSON.parse(receiptJson).logs;
        ipaId = logs[0].topics[1];
        console.log(`   IPA ID: ${ipaId}`);

        // 2. Lock IP
        console.log("2️⃣  Locking IP...");
        run(`cast send ${IP_MANAGER} "lockIPA(bytes32,address,uint256)" ${ipaId} ${USER_ADDRESS} 0 --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    }

    const isLocked = run(`cast call ${IP_MANAGER} "isIPALocked(bytes32)(bool)" ${ipaId} --rpc-url ${RPC_URL}`);
    console.log(`   Is Locked: ${isLocked}`);

    if (isLocked !== 'true') {
        throw new Error("IP failed to lock!");
    }

    // 3. Pay Royalties
    console.log("3️⃣  Paying Royalties (100 MOCK)...");
    // Mint MOCK to user (using DEPLOYER_KEY)
    run(`cast send ${MOCK_ROYALTY} "mint(address,uint256)" ${USER_ADDRESS} 100000000000000000000 --private-key ${DEPLOYER_KEY} --rpc-url ${RPC_URL}`);
    // Approve IP Manager (using USER_KEY)
    run(`cast send ${MOCK_ROYALTY} "approve(address,uint256)" ${IP_MANAGER} 100000000000000000000 --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    // Deposit Royalties (using USER_KEY)
    run(`cast send ${IP_MANAGER} "depositRoyalties(bytes32,address,uint256)" ${ipaId} ${MOCK_ROYALTY} 100000000000000000000 --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    console.log("   Royalties deposited.");

    // 4. Claim Royalties
    console.log("4️⃣  Claiming Royalties...");
    run(`cast send ${IP_MANAGER} "withdrawRoyalties(bytes32,address,uint256)" ${ipaId} ${MOCK_ROYALTY} 100000000000000000000 --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    console.log("   Claimed.");

    // 5. Auto-Repay
    console.log("5️⃣  Executing Auto-Repay...");
    run(`cast send ${MOCK_ROYALTY} "approve(address,uint256)" ${AUTO_REPAY} 100000000000000000000 --private-key ${USER_KEY} --rpc-url ${RPC_URL}`);
    
    console.log("   Calling autoRepayFromRoyalty...");
    try {
        const repayTx = run(`cast send ${AUTO_REPAY} "autoRepayFromRoyalty(bytes32,address,uint256,uint256,uint16)" ${ipaId} ${MOCK_ROYALTY} 100000000000000000000 0 50 --private-key ${USER_KEY} --rpc-url ${RPC_URL} --json`);
        console.log("✅ Auto-Repay Succeeded!");
        console.log(`   Tx: ${JSON.parse(repayTx).transactionHash}`);
    } catch (e) {
        console.error("❌ Auto-Repay Failed!");
        // Try to get revert reason
        console.log("   Attempting to trace...");
        // We can't easily trace here without re-running, but the error output from cast might have it
    }
}

main().catch(console.error);
