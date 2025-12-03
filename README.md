# Autonomy Finance

A decentralized lending and borrowing protocol with **Story Protocol IP Collateral + Royalty-Driven Auto-Repay** integration.

## Features

- 🏦 **Multi-Asset Lending**: Supply and borrow USDC, USDT, DAI, WETH, WBTC, and more
- ⚡ **E-Mode (Efficiency Mode)**: Higher LTV for correlated assets (e.g., 97% for stablecoins)
- 🎨 **IP Collateral**: Lock Story Protocol IP assets as collateral
- 💰 **Royalty Auto-Repay**: Automatically repay loans using IP royalties with DEX conversion
- 🔄 **Token Conversion**: Built-in Uniswap integration with slippage protection

## Prerequisites

- **Node.js v18+**: [Download here](https://nodejs.org/)
- **Foundry**: Smart contract toolkit
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- **MetaMask**: Browser wallet extension

## Quick Start (5 Minutes)
- ✅ Configure token conversion router
- ✅ Sync ABIs to frontend

**Expected output:**
```
🚀 Phase 1: Deploying Story Protocol Simulator (Local)
✅ Deployment successful!
🎉 Sync complete!
```

### 4. Start Frontend

In the **second terminal**, run:

```bash
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

### 5. Configure MetaMask

1. **Add Localhost Network** (if not already added):
   - Network Name: `Localhost 8545`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account**:
   - Click MetaMask → Import Account → Private Key
   - Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 ETH and all test tokens

3. **Connect to App**:
   - Click "Connect Wallet" in the app
   - Approve the connection

## Testing the Full Flow

### Basic Lending & Borrowing

1. **Supply Collateral**:
   - Go to "CORE INSTANCE" page
   - Find USDC in "Assets to Supply"
   - Click "Supply" → Enter amount (e.g., 1000) → Confirm

2. **Borrow**:
   - Find USDT in "Assets to Borrow"
   - Click "Borrow" → Enter amount (e.g., 500) → Confirm

3. **Enable E-Mode** (Optional):
   - In "Your Borrows" section, toggle "E-Mode"
   - Get 97% LTV for stablecoins!

### Story Protocol IP Flow

1. **Mint IP Asset**:
   - Go to `/ip-mint`
   - Enter title: "My Song"
   - Enter description: "A great track"
   - Click "Mint IP Asset"
   - Confirm transaction

2. **Lock as Collateral**:
   - After minting, enter collateral value: `10000`
   - Click "Lock as Collateral"
   - Confirm transaction

3. **Borrow Against IP**:
   - Go back to "CORE INSTANCE"
   - Borrow USDC (your IP is now collateral)

4. **Simulate Royalty Payment**:
   - Go to `/ip-dashboard`
   - Enter your IPA ID (from step 1)
   - Click "Load"
   - In the simulator (right side):
     - Select "MOCK Token"
     - Enter amount: `1000`
     - Click "Pay Royalty"

5. **Auto-Repay Debt**:
   - Click "Claim & Auto-Repay Debt"
   - The system will:
     - ✅ Claim 1000 MOCK tokens
     - ✅ Convert MOCK → USDC via DEX
     - ✅ Repay your loan automatically
     - ✅ Deduct 0.1% conversion fee

## Project Structure

```
story-autonomy-finance/
├── contracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── LendingPool.sol
│   │   ├── IPManager.sol
│   │   ├── AutoRepayEngine.sol
│   │   └── dev/            # Mock contracts for testing
│   ├── script/Deploy.s.sol
│   └── test/
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── pages/          # IPMint, Core, Asset pages
│   │   ├── components/     # IPDashboard, IPSimulator
│   │   └── hooks/          # useStoryProtocol, useLendingPool
├── scripts/
│   ├── deploy_local.sh     # Local deployment script
│   └── sync-frontend.js    # ABI sync script
└── setup.md                # Detailed setup guide
```

## Development

### Smart Contracts

```bash
cd contracts

# Compile
forge build

# Run all tests
forge test

# Run specific test
forge test --match-contract StoryProtocolIntegration

# Gas report
forge test --gas-report
```

### Frontend

```bash
cd frontend

# Type check
npm run build

# Lint
npm run lint
```

## Troubleshooting

### "Contract not deployed" error
**Solution:** Run `./scripts/deploy_local.sh` again.

### White screen / blank page
**Solution:** 
1. Check Anvil is running (`npm run chain`)
2. Redeploy contracts
3. Hard refresh browser (Ctrl+Shift+R)

### MetaMask transaction fails
**Solution:**
1. Reset account: MetaMask → Settings → Advanced → Reset Account
2. This clears the nonce cache

### "Insufficient balance" error
**Solution:** You're using the wrong account. Import the test account with the private key above.

## Advanced

### Run Production Build

```bash
cd frontend
npm run build
npm run preview
```

### Deploy to Testnet

See `setup.md` for production deployment instructions.

## Documentation

- **[setup.md](./setup.md)**: Detailed setup for Phase 1 (local) and Phase 2 (production)
- **[walkthrough.md](./.gemini/antigravity/brain/.../walkthrough.md)**: Feature walkthrough with test results

## Tech Stack

- **Smart Contracts**: Solidity 0.8.24, Foundry
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Testing**: Foundry (Solidity), Vitest (TypeScript)

## License

MIT
