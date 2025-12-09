// Register single IP for user
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { aeneid } from './chains';
import RoyaltyDistributorABI from '../frontend/src/abis/RoyaltyDistributor.json';
import { ROYALTY_SIMULATOR_CONTRACTS } from '../frontend/src/constants/royaltySimulator';

const RPC_URL = 'https://aeneid.storyrpc.io';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY environment variable not set');
}

// User's IP to register
const IP_TO_REGISTER = {
    ipId: '0x9B17FDA21743F865A16D51ec4a032409D6a893eB',
    owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    royaltyPercent: 49
};

async function main() {
    console.log('🚀 Registering IP in RoyaltyDistributor...\n');

    const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace('0x', '')}`);

    const publicClient = createPublicClient({
        chain: aeneid,
        transport: http(RPC_URL)
    });

    const walletClient = createWalletClient({
        account,
        chain: aeneid,
        transport: http(RPC_URL)
    });

    console.log(`Deployer: ${account.address}`);
    console.log(`RoyaltyDistributor: ${ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor}`);
    console.log(`IP ID: ${IP_TO_REGISTER.ipId}\n`);

    try {
        // Check if already registered
        console.log('Checking registration status...');
        const isRegistered = await publicClient.readContract({
            address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
            abi: RoyaltyDistributorABI,
            functionName: 'isIpRegistered',
            args: [IP_TO_REGISTER.ipId]
        }) as boolean;

        if (isRegistered) {
            console.log('✓ IP is already registered!');
            console.log('\nYou can now use this IP in the Royalty Simulator.');
            process.exit(0);
        }

        // Register IP
        console.log(`Registering IP with ${IP_TO_REGISTER.royaltyPercent}% royalty...`);

        const hash = await walletClient.writeContract({
            address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
            abi: RoyaltyDistributorABI,
            functionName: 'registerIp',
            args: [
                IP_TO_REGISTER.ipId,
                IP_TO_REGISTER.owner,
                BigInt(IP_TO_REGISTER.royaltyPercent),
                '0x0000000000000000000000000000000000000000'
            ]
        });

        console.log(`\nTransaction submitted: ${hash}`);
        console.log(`Explorer: https://aeneid.storyscan.io/tx/${hash}`);

        // Wait for confirmation
        console.log('\nWaiting for confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
            console.log('\n✅ IP registered successfully!');
            console.log('\nYou can now:');
            console.log('1. Go to http://localhost:5173/royalty-simulator');
            console.log('2. Paste your IP ID: 0x9B17FDA21743F865A16D51ec4a032409D6a893eB');
            console.log('3. Enter simulation values');
            console.log('4. Click "SIMULATE REVENUE"');
            console.log('5. Tokens will be minted to your IP owner address!');
        } else {
            console.log('\n✗ Transaction failed');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n✗ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
