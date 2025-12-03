#!/bin/bash

# Configuration
RPC_URL="http://localhost:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" # Anvil default #0
USER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Contract Addresses (from contracts.ts / deployment)
# Update these if deployment changes!
USDC="0xd42912755319665397ff090fbb63b1a31ae87cee"
MOCK_ROYALTY="0x5d42ebdbba61412295d7b0302d6f50ac449ddb4f"
IP_MANAGER="0xc582bc0317dbb0908203541971a358c44b1f3766"
AUTO_REPAY="0xb2b580ce436e6f77a5713d80887e14788ef49c9a"
MOCK_REGISTRY="0x70bda08dbe07363968e9ee53d899dfe48560605b"
VAULT="0xe1fd27f4390dcbe165f4d60dbf821e4b9bb02ded"

echo "🚀 Starting Auto-Repay Debug Flow..."

# 1. Mint a new IP Asset
echo "1️⃣  Minting new IP Asset..."
MINT_TX=$(cast send $MOCK_REGISTRY "mintIP(address,string)" $USER_ADDRESS "ipfs://test" --private-key $PRIVATE_KEY --rpc-url $RPC_URL --json | jq -r .transactionHash)
echo "   Tx: $MINT_TX"

# Get IPA ID from logs (Topic 1 of first log)
IPA_ID=$(cast receipt $MINT_TX --rpc-url $RPC_URL --json | jq -r .logs[0].topics[1])
echo "   IPA ID: $IPA_ID"

# 2. Lock IP (Zero Collateral - Fixed!)
echo "2️⃣  Locking IP..."
cast send $IP_MANAGER "lockIPA(bytes32,address,uint256)" $IPA_ID $USER_ADDRESS 0 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null
IS_LOCKED=$(cast call $IP_MANAGER "isIPALocked(bytes32)(bool)" $IPA_ID --rpc-url $RPC_URL)
echo "   Is Locked: $IS_LOCKED"

# 3. Pay Royalties (in MOCK token)
echo "3️⃣  Paying Royalties (100 MOCK)..."
# Mint MOCK to user first
cast send $MOCK_ROYALTY "mint(address,uint256)" $USER_ADDRESS 100000000000000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null
# Approve IP Manager
cast send $MOCK_ROYALTY "approve(address,uint256)" $IP_MANAGER 100000000000000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null
# Deposit Royalties
cast send $IP_MANAGER "depositRoyalties(bytes32,address,uint256)" $IPA_ID $MOCK_ROYALTY 100000000000000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null
echo "   Royalties deposited."

# 4. Claim Royalties
echo "4️⃣  Claiming Royalties..."
# Check balance before
BAL_BEFORE=$(cast call $MOCK_ROYALTY "balanceOf(address)(uint256)" $USER_ADDRESS --rpc-url $RPC_URL)
# Withdraw
cast send $IP_MANAGER "withdrawRoyalties(bytes32,address,uint256)" $IPA_ID $MOCK_ROYALTY 100000000000000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null
BAL_AFTER=$(cast call $MOCK_ROYALTY "balanceOf(address)(uint256)" $USER_ADDRESS --rpc-url $RPC_URL)
echo "   Claimed. Balance delta: $(($BAL_AFTER - $BAL_BEFORE))"

# 5. Auto-Repay
echo "5️⃣  Executing Auto-Repay..."
# Need debt first? For this test we assume user has debt or we just test the engine call
# To test engine, we need to approve engine to spend our claimed royalties
cast send $MOCK_ROYALTY "approve(address,uint256)" $AUTO_REPAY 100000000000000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null

# Call autoRepayFromRoyalty
# Note: This might fail if user has no debt. But we want to see IF it reverts and WHY.
echo "   Calling autoRepayFromRoyalty..."
cast send $AUTO_REPAY "autoRepayFromRoyalty(bytes32,address,uint256,uint256)" $IPA_ID $MOCK_ROYALTY 100000000000000000000 0 --private-key $PRIVATE_KEY --rpc-url $RPC_URL

echo "✅ Done."
