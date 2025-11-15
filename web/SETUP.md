# Frontend Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Extract ABIs from compiled contracts:**
   ```bash
   node scripts/extract-abis.mjs
   ```
   
   This script reads the compiled contract JSON files from `../out/` and extracts the ABI arrays into `src/abis/`.

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your deployed contract addresses:
   ```env
   VITE_RPC_URL=https://rpc.testnet.mantle.xyz
   VITE_CHAIN_ID=5001
   VITE_AUTONOMY_ADDRESS=0x...
   VITE_ADAPTER_ADDRESS=0x...
   VITE_ATASSET_ADDRESS=0x...
   VITE_COLLATERAL_ADDRESS=0x...
   VITE_PRICE_ORACLE_ADDRESS=0x...
   ```

4. **Get WalletConnect Project ID:**
   - Go to https://cloud.walletconnect.com
   - Create a project and get your Project ID
   - Update `src/lib/wagmi.ts` with your Project ID (replace `YOUR_PROJECT_ID`)

5. **Run the development server:**
   ```bash
   npm run dev
   ```

## What Was Built

### Pages
- ✅ Dashboard - Overview of positions and protocol stats
- ✅ Vault - Deposit and withdraw collateral
- ✅ Borrow - Mint and repay atAssets
- ✅ Harvest - Trigger yield accrual and auto-repay
- ✅ Positions - Detailed view of user positions
- ✅ Docs - Architecture and feature documentation
- ✅ Admin - Read-only view of protocol parameters

### Components
- ✅ Layout with navigation
- ✅ StatCard for displaying metrics
- ✅ ActionCard for forms
- ✅ NumberInput with MAX button
- ✅ TxButton for transactions
- ✅ TokenAmount for formatting
- ✅ AddressBadge for addresses

### Hooks
- ✅ useAutonomy - Read protocol state and user positions
- ✅ useAdapter - Read adapter state (exchange rate, APY, etc.)
- ✅ useOracle - Read oracle prices
- ✅ useTokenBalance - Read ERC20 token balances

### Features
- ✅ Wallet connection via RainbowKit
- ✅ Network guard (Mantle testnet)
- ✅ Transaction handling with toasts
- ✅ Form validation with react-hook-form + zod
- ✅ Responsive design with TailwindCSS
- ✅ Documentation pages with markdown rendering

## Contract Integration

The frontend integrates with:
- `AutonomyV1` - Main protocol contract
- `Adapter` - Yield adapter
- `RWAAdapter` - RWA adapter (optional)
- `AtAsset` - Debt token
- `CollateralToken` - Collateral token
- `MockOracle` - Price oracle
- `RWAOracle` - RWA oracle (optional)

## Next Steps

1. Deploy contracts to Mantle testnet (if not already deployed)
2. Update `.env` with deployed addresses
3. Extract ABIs using the script
4. Update WalletConnect Project ID
5. Test all flows end-to-end
6. Record demo following the script in `/docs/mvp-demo.md`

## Troubleshooting

### ABIs not found
- Make sure contracts are compiled (`forge build` in root directory)
- Run `node scripts/extract-abis.mjs` to extract ABIs
- Check that `out/` directory exists with compiled contracts

### Wallet connection issues
- Ensure you're on Mantle testnet (Chain ID: 5001)
- Check that WalletConnect Project ID is set
- Verify RPC URL is accessible

### Transaction failures
- Check you have sufficient MNT for gas
- Verify contract addresses are correct in `.env`
- Ensure you've approved tokens if needed
- Check browser console for error messages

### Import errors
- Make sure ABIs are extracted to `src/abis/`
- Verify all dependencies are installed (`npm install`)
- Check that TypeScript can resolve the imports

## Additional Notes

- The app uses Vite for fast development
- TailwindCSS is configured with a custom theme
- All contract interactions use Wagmi v2
- Toast notifications use react-toastify
- Forms use react-hook-form with Zod validation

