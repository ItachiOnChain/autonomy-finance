#!/bin/bash
# Story Aeneid Testnet Deployment Script
# This script deploys Autonomy Finance to Story Aeneid testnet and syncs the frontend

set -e  # Exit on error

echo "================================================"
echo "  Story Aeneid Testnet Deployment"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo ""
    echo "Please create a .env file with the following variables:"
    echo "  STORY_RPC_URL=\"https://aeneid.storyrpc.io\""
    echo "  STORY_PRIVATE_KEY=\"your_private_key_here\""
    echo ""
    echo "You can copy .env.example to .env and update the values:"
    echo "  cp .env.example .env"
    echo ""
    exit 1
fi

# Load environment variables
source .env

# Validate required variables
if [ -z "$STORY_RPC_URL" ]; then
    echo "❌ Error: STORY_RPC_URL not set in .env"
    exit 1
fi

if [ -z "$STORY_PRIVATE_KEY" ]; then
    echo "❌ Error: STORY_PRIVATE_KEY not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "   RPC URL: $STORY_RPC_URL"
echo ""

# Check RPC connectivity
echo "🔍 Testing RPC connectivity..."
if ! cast block-number --rpc-url $STORY_RPC_URL > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to Story Aeneid RPC"
    echo "   Please check your internet connection and RPC URL"
    exit 1
fi
echo "✅ RPC connection successful"
echo ""

# Get deployer address
DEPLOYER_ADDRESS=$(cast wallet address --private-key $STORY_PRIVATE_KEY)
echo "📍 Deployer address: $DEPLOYER_ADDRESS"

# Check deployer balance
BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $STORY_RPC_URL)
BALANCE_IP=$(echo "scale=4; $BALANCE / 1000000000000000000" | bc)
echo "💰 Deployer balance: $BALANCE_IP IP"
echo ""

# Warn if balance is low
if (( $(echo "$BALANCE_IP < 0.1" | bc -l) )); then
    echo "⚠️  WARNING: Low IP balance!"
    echo "   Recommended: At least 0.5 IP for deployment"
    echo "   Get testnet IP from Story Aeneid faucet"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Navigate to contracts directory
cd contracts

echo "🚀 Starting deployment to Story Aeneid..."
echo ""

# Deploy contracts
forge script script/DeployStoryAeneid.s.sol:DeployStoryAeneid \
    --rpc-url $STORY_RPC_URL \
    --private-key $STORY_PRIVATE_KEY \
    --broadcast \
    --legacy

DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Common issues:"
    echo "  • Insufficient IP balance"
    echo "  • RPC rate limiting"
    echo "  • Gas estimation failure (try adding --gas-limit 10000000)"
    echo "  • Constructor parameter error"
    echo ""
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

# Navigate back to root
cd ..

# Sync frontend
echo "🔄 Syncing frontend with deployed contracts..."
echo ""

node scripts/sync-frontend.js --network storyAeneid

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Warning: Frontend sync failed"
    echo "   You may need to manually update frontend/src/config/contracts.ts"
    echo ""
    exit 1
fi

echo ""
echo "================================================"
echo "  ✅ DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Verify contracts on Story Aeneid explorer:"
echo "     https://aeneid.storyscan.io/address/$DEPLOYER_ADDRESS"
echo ""
echo "  2. Update frontend to connect to Story Aeneid:"
echo "     - Chain ID: 1315"
echo "     - RPC: https://aeneid.storyrpc.io"
echo ""
echo "  3. Configure MetaMask:"
echo "     - Network Name: Story Aeneid Testnet"
echo "     - RPC URL: https://aeneid.storyrpc.io"
echo "     - Chain ID: 1315"
echo "     - Currency Symbol: IP"
echo "     - Explorer: https://aeneid.storyscan.io"
echo ""
echo "================================================"
