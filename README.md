# Autonomy Finance

A decentralized lending and borrowing protocol with **Story Protocol IP Collateral + Royalty-Driven Auto-Repay** integration.

## Features

- 🏦 **Multi-Asset Lending**: Supply and borrow USDC, USDT, DAI, WETH, WBTC, and more
- ⚡ **E-Mode (Efficiency Mode)**: Higher LTV for correlated assets (e.g., 97% for stablecoins)
- 🎨 **IP Collateral**: Lock Story Protocol IP assets as collateral
- 💰 **Royalty Auto-Repay**: Automatically repay loans using IP royalties with DEX conversion
- 🔄 **Token Conversion**: Built-in Uniswap integration with slippage protection
- 🎭 **Royalty Simulator**: Simulate derivative revenue distribution for Story Protocol IPs

## Royalty Simulator (Aeneid Testnet)

The Royalty Simulator demonstrates how derivative revenue is distributed to IP owners based on royalty percentages.

### Deployed Contracts

- **MockERC20**: `0x242e50f40E771da8F19aAF1b813658A8562B2ad2`
  - Mintable token for simulating royalty payments
  - Symbol: MRT (Mock Royalty Token)
  - Decimals: 18

- **RoyaltyDistributor**: `0x366FDba679A8ece0567C1aFFC8C543f6FE9964d5`
  - Manages IP registration and revenue distribution
  - Supports royalty percentages from 0-100%
  - Integrates with lending pools for auto-repayment

### Quick Demo

1. **Navigate to Royalty Simulator**: Click "Royalty Simulator" in the navbar
2. **Select IP**: Choose from your owned Story Protocol IPs
3. **Mint Tokens** (Dev): Click "Mint Mock Tokens" to get test tokens
4. **Simulate Revenue**:
   - Enter revenue per derivative (e.g., 100 MRT)
   - Enter number of derivatives (e.g., 50)
   - Click "SIMULATE REVENUE"
5. **View Results**: See transaction hash and updated royalty balance

### For Developers

**Mint Mock Tokens**:
```bash
cast send 0x242e50f40E771da8F19aAF1b813658A8562B2ad2 \
  "mint(address,uint256)" \
  <YOUR_ADDRESS> \
  1000000000000000000000 \
  --rpc-url https://aeneid.storyrpc.io \
  --private-key $DEPLOYER_PRIVATE_KEY
```

**Register IP**:
```bash
cast send 0x366FDba679A8ece0567C1aFFC8C543f6FE9964d5 \
  "registerIp(string,address,uint256,address)" \
  "0x1234..." \
  <OWNER_ADDRESS> \
  10 \
  0x0000000000000000000000000000000000000000 \
  --rpc-url https://aeneid.storyrpc.io \
  --private-key $DEPLOYER_PRIVATE_KEY
```

See [ROYALTY_SIMULATOR_DEPLOYMENT.md](./ROYALTY_SIMULATOR_DEPLOYMENT.md) for full documentation.


## Prerequisites

- **Node.js v18+**: [Download here](https://nodejs.org/)
- **Foundry**: Smart contract toolkit
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- **MetaMask**: Browser wallet extension

## Quick Start (5 Minutes)

### Local Development (Anvil)

**Terminal 1 - Start Local Blockchain:**
```bash
npm run chain
```

**Terminal 2 - Deploy Contracts:**
```bash
./scripts/deploy-local.sh
```

This will:
- ✅ Deploy all contracts to Anvil
- ✅ Configure token conversion router
- ✅ Sync ABIs to frontend

**Expected output:**
```
🚀 Phase 1: Deploying Story Protocol Simulator (Local)
✅ Deployment successful!
🎉 Sync complete!
```
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

## Supported Networks

Autonomy Finance supports the following networks:

| Network | Chain ID | RPC URL | Explorer | Status |
|---------|----------|---------|----------|--------|
| **Anvil Local** | 31337 | http://localhost:8545 | N/A | ✅ Active |
| **Story Aeneid Testnet** | 1315 | https://aeneid.storyrpc.io | https://aeneid.storyscan.io | ✅ Active |

---

## Story Aeneid Testnet Deployment

### Prerequisites

1. **Get Testnet IP Tokens**:
   - Visit Story Aeneid faucet (contact Story Protocol team)
   - You'll need ~0.5 IP for deployment

2. **Prepare Deployer Wallet**:
   - Create a new wallet or use existing testnet wallet
   - **NEVER use mainnet private keys**
   - Export private key (without 0x prefix)

### Deployment Steps

#### 1. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Update the following variables:

```bash
# Story Aeneid Testnet
STORY_RPC_URL="https://aeneid.storyrpc.io"
STORY_PRIVATE_KEY="your_private_key_here_without_0x_prefix"
```

> [!WARNING]
> **Never commit your `.env` file to git!** It contains sensitive private keys.

#### 2. Verify RPC Connection

Test connectivity to Story Aeneid:

```bash
cast block-number --rpc-url https://aeneid.storyrpc.io
```

Expected output: Current block number (e.g., `12345678`)

#### 3. Check Deployer Balance

```bash
# Get your deployer address
cast wallet address --private-key $STORY_PRIVATE_KEY

# Check balance
cast balance YOUR_ADDRESS --rpc-url https://aeneid.storyrpc.io
```

Ensure you have at least **0.5 IP** for deployment.

#### 4. Deploy Contracts

Run the deployment script:

```bash
./scripts/deploy-story-aeneid.sh
```

The script will:
- ✅ Validate environment variables
- ✅ Check RPC connectivity
- ✅ Verify deployer balance
- ✅ Deploy all contracts to Story Aeneid
- ✅ Configure lending pool and E-Mode
- ✅ Sync ABIs to frontend

**Expected output:**
```
================================================
  Story Aeneid Testnet Deployment
================================================

✅ Environment variables loaded
✅ RPC connection successful
📍 Deployer address: 0x...
💰 Deployer balance: 1.5 IP

🚀 Starting deployment to Story Aeneid...

Deploying Mock Tokens...
  USDC deployed at: 0x...
  USDT deployed at: 0x...
  ...

✅ Deployment successful!
🔄 Syncing frontend with deployed contracts...

================================================
  ✅ DEPLOYMENT COMPLETE
================================================
```

#### 5. Verify Deployment

Check deployed contracts on Story Aeneid explorer:

```
https://aeneid.storyscan.io/address/YOUR_DEPLOYER_ADDRESS
```

### Permanent Contract Addresses

These addresses are **permanently deployed** on Story Aeneid testnet and used by the frontend:

| Contract | Story Aeneid Address | Description |
|----------|---------------------|-------------|
| **Core Contracts** | | |
| LendingPool | `0x3358F984e9B3CBBe976eEFE9B6fb92a214162932` | Main lending/borrowing pool |
| PriceOracle | `0x69eB226983E10D7318816134cd44BE3023dC74cd` | Asset price oracle |
| InterestRateModel | `0xD8fE7c45330c8b12cA0D4728D75557b9e7BeB24F` | Interest rate calculator |
| **Autonomy System** | | |
| AutonomyVault | `0x95D7fF1684a8F2e202097F28Dc2e56F773A55D02` | Collateral vault |
| IPManager | `0x897945A56464616a525C9e5F11a8D400a72a8f3A` | IP asset manager |
| AutoRepayEngine | `0x633a7eB9b8912b22f3616013F3153de687F96074` | Royalty-based auto-repay |
| **Tokens** | | |
| USDC | `0x43c5DF0c482c88Cef8005389F64c362eE720A5bC` | Mock USDC (6 decimals) |
| USDT | `0x2098cb47B17082Ab6969FB2661f2759A9BF357c4` | Mock USDT (6 decimals) |
| WETH | `0xF01f4567586c3A707EBEC87651320b2dd9F4A287` | Mock WETH (18 decimals) |
| WBTC | `0x2B07F89c9F574a890F5B8b7FddAfbBaE40f6Fde2` | Mock WBTC (8 decimals) |
| DAI | `0xCaC60200c1Cb424f2C1e438c7Ee1B98d487f0254` | Mock DAI (18 decimals) |
| LINK | `0xABc84968376556B5e5B3C3bda750D091a06De536` | Mock LINK (18 decimals) |
| UNI | `0xFf8FA9381caf61cB3368a6ec0b3F5C788028D0Cd` | Mock UNI (18 decimals) |
| AAVE | `0xE55cc27460B55c8aC7E73043F38b537758C9E51e` | Mock AAVE (18 decimals) |
| **Mocks** | | |
| MockRoyaltyToken | `0x5aA185fbEFc205072FaecC6B9D564383e761f8C2` | Mock royalty token |
| MockIPAssetRegistry | `0xA4f9885550548c6a45b9D18C57B114c06f3c39B8` | Mock Story Protocol IP registry |
| MockRoyaltyVault | `0x886a2A3ABF5B79AA5dFF1C73016BD07CFc817e04` | Mock royalty vault |
| MockRoyaltyModule | `0x449C286Ab90639fd9F6604F4f15Ec86bce2b8A61` | Mock royalty module |
| MockUniswapRouter | `0x63275D081C4A77AE69f76c4952F9747a5559a519` | Mock DEX router |

> [!NOTE]
> **Deployed on**: December 8, 2024  
> **Deployer**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  
> **Total Cost**: 0.623 IP  
> **View on Explorer**: [Story Aeneid Explorer](https://aeneid.storyscan.io/address/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)

### Frontend Integration

After deployment, the frontend automatically loads the correct contracts based on chain ID:

```typescript
import { getContracts } from './config/contracts';

// Automatically uses correct addresses for current network
const contracts = getContracts(chainId); // 1315 for Story Aeneid
```

### Configure MetaMask

Add Story Aeneid network to MetaMask:

1. **Open MetaMask** → Networks → Add Network
2. **Enter Network Details**:
   - Network Name: `Story Aeneid Testnet`
   - RPC URL: `https://aeneid.storyrpc.io`
   - Chain ID: `1315`
   - Currency Symbol: `IP`
   - Block Explorer: `https://aeneid.storyscan.io`
3. **Save** and switch to Story Aeneid network

---

## Local Development Setup

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

### Story Aeneid Deployment Issues

#### ❌ Insufficient IP Balance

**Error:**
```
Error: insufficient funds for gas * price + value
```

**Solution:**
1. Check your deployer balance:
   ```bash
   cast balance YOUR_ADDRESS --rpc-url https://aeneid.storyrpc.io
   ```
2. Get testnet IP from Story Aeneid faucet
3. Ensure you have at least **0.5 IP** before deploying

---

#### ❌ RPC Connection Errors

**Error:**
```
Error: failed to get chain id: connection refused
Error: timeout waiting for response
```

**Solutions:**
1. **Check internet connection**
2. **Verify RPC URL** in `.env`:
   ```bash
   STORY_RPC_URL="https://aeneid.storyrpc.io"
   ```
3. **Test connectivity**:
   ```bash
   cast block-number --rpc-url https://aeneid.storyrpc.io
   ```
4. **Rate limiting**: Wait a few minutes and retry
5. **Try alternative RPC** (if available from Story Protocol team)

---

#### ❌ Constructor Revert / Deployment Failure

**Error:**
```
Error: contract deployment failed
Revert reason: <empty or cryptic message>
```

**Solutions:**
1. **Check constructor parameters** in `DeployStoryAeneid.s.sol`
2. **Verify dependency addresses** (e.g., InterestRateModel address passed to LendingPool)
3. **Review deployment logs** for the specific contract that failed
4. **Increase gas limit**:
   ```bash
   forge script script/DeployStoryAeneid.s.sol:DeployStoryAeneid \
     --rpc-url $STORY_RPC_URL \
     --private-key $STORY_PRIVATE_KEY \
     --broadcast \
     --gas-limit 10000000
   ```

---

#### ❌ Gas Estimation Failure

**Error:**
```
Error: failed to estimate gas
```

**Solutions:**
1. **Use legacy transactions**:
   ```bash
   forge script script/DeployStoryAeneid.s.sol:DeployStoryAeneid \
     --rpc-url $STORY_RPC_URL \
     --private-key $STORY_PRIVATE_KEY \
     --broadcast \
     --legacy
   ```
2. **Manually set gas price**:
   ```bash
   --gas-price 1000000000  # 1 gwei
   ```
3. **Check RPC is not rate limiting**

---

#### ❌ Private Key Issues

**Error:**
```
Error: invalid private key
Error: could not decode private key
```

**Solutions:**
1. **Remove 0x prefix** from private key in `.env`:
   ```bash
   # ❌ Wrong
   STORY_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
   
   # ✅ Correct
   STORY_PRIVATE_KEY="ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
   ```
2. **Verify key length** (64 characters without 0x)
3. **Check for extra spaces** or newlines

---

### Frontend Issues

#### ❌ "Contract not deployed" error

**Solution:**
1. **For Anvil**: Run `./scripts/deploy-local.sh` again
2. **For Story Aeneid**: Verify deployment completed successfully
3. **Check network**: Ensure MetaMask is on correct network (31337 or 1315)
4. **Verify contract addresses** in `frontend/src/config/contracts.ts`

---

#### ❌ Frontend not showing Story Aeneid contracts

**Error:**
Frontend shows "No contracts found" or uses wrong addresses

**Solutions:**
1. **Re-sync frontend**:
   ```bash
   node scripts/sync-frontend.js --network=storyAeneid
   ```
2. **Verify `contracts.ts`** contains chainId 1315:
   ```typescript
   export const CONTRACTS = {
       1315: { // Story Aeneid
           LENDING_POOL: { address: "0x...", ... },
           ...
       }
   }
   ```
3. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
4. **Restart frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

---

#### ❌ White screen / blank page

**Solution:** 
1. Check Anvil is running (`npm run chain`)
2. Redeploy contracts
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for errors (F12)

---

#### ❌ MetaMask transaction fails

**Solution:**
1. **Reset account nonce**: MetaMask → Settings → Advanced → Reset Account
2. **Check network**: Ensure MetaMask is on correct network
3. **Verify gas settings**: Use default gas settings
4. **Check balance**: Ensure you have enough ETH/IP for gas

---

#### ❌ "Insufficient balance" error

**Solution:** 
You're using the wrong account. 

**For Anvil:**
Import the test account with private key:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**For Story Aeneid:**
1. Ensure your wallet has testnet IP tokens
2. Get tokens from Story Aeneid faucet

---

#### ❌ Wrong network detected

**Error:**
Frontend shows "Please connect to Story Aeneid" but you're already connected

**Solutions:**
1. **Disconnect and reconnect** wallet in app
2. **Switch networks** in MetaMask:
   - For local: Localhost 8545 (Chain ID 31337)
   - For testnet: Story Aeneid (Chain ID 1315)
3. **Clear MetaMask cache**: Settings → Advanced → Clear activity tab data
4. **Restart browser**

---

### Contract Interaction Issues

#### ❌ "Execution reverted" errors

**Common causes:**
1. **Insufficient allowance**: Approve tokens before supplying/borrowing
2. **Insufficient collateral**: Supply collateral before borrowing
3. **Health factor too low**: Cannot borrow more without additional collateral
4. **Asset not initialized**: Check asset is configured in lending pool

**Debug steps:**
1. Check transaction details in block explorer
2. Review contract state using `cast` commands
3. Verify token balances and allowances
4. Check lending pool reserves

---

### Development Issues

#### ❌ Foundry compilation errors

**Solution:**
```bash
cd contracts
forge clean
forge build
```

#### ❌ Frontend TypeScript errors

**Solution:**
```bash
cd frontend
npm run build  # Check for type errors
```

#### ❌ ABI sync issues

**Solution:**
```bash
# For Anvil
node scripts/sync-frontend.js

# For Story Aeneid
node scripts/sync-frontend.js --network=storyAeneid
```

---

### Getting Help

If you're still experiencing issues:

1. **Check deployment logs** for specific error messages
2. **Verify all prerequisites** are met (Node.js, Foundry, etc.)
3. **Review contract addresses** on block explorer
4. **Test with minimal example** (single token supply/borrow)
5. **Open an issue** on GitHub with:
   - Error message
   - Steps to reproduce
   - Network (Anvil or Story Aeneid)
   - Transaction hash (if applicable)

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
