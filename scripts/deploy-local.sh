#!/bin/bash
set -e

echo "🚀 Phase 1: Deploying Story Protocol Simulator (Local)"

# Navigate to project root
cd "$(dirname "$0")/.."

# Load environment variables if .env exists
if [ -f .env ]; then
    echo "📄 Loading .env file..."
    source .env
fi

# Default to local anvil key if not provided
DEPLOYER_PK=${DEPLOYER_PK:-"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}
RPC_URL=${RPC_URL:-"http://127.0.0.1:8545"}

echo "🔍 Checking Anvil connection..."
if ! nc -z localhost 8545 2>/dev/null; then
    echo "⚠️  Anvil not running on port 8545"
    echo "💡 Start Anvil in another terminal: npm run chain"
    exit 1
fi

echo "📦 Deploying contracts to local Anvil..."
cd contracts

# Run Foundry deployment script
forge script script/Deploy.s.sol:DeployScript \
    --broadcast \
    --rpc-url $RPC_URL \
    --private-key $DEPLOYER_PK \
    -vvv

echo "✅ Deployment complete!"

# Sync frontend
echo "🔄 Syncing frontend contracts..."
cd ..
node scripts/sync-frontend.js

echo ""
echo "🎉 Phase 1 deployment successful!"
echo ""
echo "📍 Next steps:"
echo "   1. Start frontend: cd frontend && npm run dev"
echo "   2. Open http://localhost:5173"
echo "   3. Connect MetaMask to localhost:8545"
echo "   4. Use the IP Mint page to test the flow"
echo ""
