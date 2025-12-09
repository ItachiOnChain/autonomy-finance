// Batch IP Registration Script
// Run this to register all existing IPs in RoyaltyDistributor

import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { aeneid } from './chains';
import RoyaltyDistributorABI from '../frontend/src/abis/RoyaltyDistributor.json';
import { ROYALTY_SIMULATOR_CONTRACTS } from '../frontend/src/constants/royaltySimulator';

// Configuration
const RPC_URL = 'https://aeneid.storyrpc.io';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY environment variable not set');
}

// Sample IPs to register - UPDATE THIS with your actual IP IDs
const IPS_TO_REGISTER = [
    {
        ipId: '0x9B17FDA21743F865A16D51ec4a032409D6a893eB',
        owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        royaltyPercent: 49
    },
    {
        ipId: '0x6d30f75291887d624155c06D8BBb7822611B9842',
        owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        royaltyPercent: 49
    }
];

async function main() {
    console.log('🚀 Starting batch IP registration...\n');

    // Setup clients
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
    console.log(`RoyaltyDistributor: ${ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor}\n`);

    let registered = 0;
    let skipped = 0;
    let failed = 0;

    for (const ip of IPS_TO_REGISTER) {
        try {
            console.log(`\n📝 Processing IP: ${ip.ipId}`);

            // Check if already registered
            const isRegistered = await publicClient.readContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'isIpRegistered',
                args: [ip.ipId]
            }) as boolean;

            if (isRegistered) {
                console.log(`   ✓ Already registered, skipping`);
                skipped++;
                continue;
            }

            // Register IP
            console.log(`   → Registering with ${ip.royaltyPercent}% royalty...`);

            const hash = await walletClient.writeContract({
                address: ROYALTY_SIMULATOR_CONTRACTS.RoyaltyDistributor,
                abi: RoyaltyDistributorABI,
                functionName: 'registerIp',
                args: [
                    ip.ipId,
                    ip.owner,
                    BigInt(ip.royaltyPercent),
                    '0x0000000000000000000000000000000000000000' // No lending pool
                ]
            });

            console.log(`   → Transaction: ${hash}`);

            // Wait for confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            if (receipt.status === 'success') {
                console.log(`   ✓ Registered successfully!`);
                registered++;
            } else {
                console.log(`   ✗ Transaction failed`);
                failed++;
            }

        } catch (error) {
            console.error(`   ✗ Error:`, error instanceof Error ? error.message : error);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Registration Summary:');
    console.log(`   ✓ Registered: ${registered}`);
    console.log(`   ⊘ Skipped (already registered): ${skipped}`);
    console.log(`   ✗ Failed: ${failed}`);
    console.log(`   📝 Total processed: ${IPS_TO_REGISTER.length}`);
    console.log('='.repeat(50) + '\n');

    if (failed > 0) {
        console.log('⚠️  Some registrations failed. Check the errors above.');
        process.exit(1);
    } else {
        console.log('✅ All IPs processed successfully!');
        process.exit(0);
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
