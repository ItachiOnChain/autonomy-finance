# Autonomy Finance Frontend

React frontend for Autonomy Finance - a self-repaying lending and borrowing protocol on Mantle.

## Setup

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your contract addresses:
   ```env
   VITE_RPC_URL=https://rpc.testnet.mantle.xyz
   VITE_CHAIN_ID=5001
   VITE_AUTONOMY_ADDRESS=0x...
   VITE_ADAPTER_ADDRESS=0x...
   VITE_ATASSET_ADDRESS=0x...
   VITE_COLLATERAL_ADDRESS=0x...
   VITE_PRICE_ORACLE_ADDRESS=0x...
   ```

3. **Extract ABIs:**
   ```bash
   node scripts/extract-abis.mjs
   ```
   
   This copies ABIs from the `out/` directory to `src/abis/`.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Features

- **Dashboard**: Overview of positions and protocol stats
- **Vault**: Deposit and withdraw collateral
- **Borrow**: Mint and repay atAssets
- **Harvest**: Trigger yield accrual and auto-repay
- **Positions**: Detailed view of user positions
- **Docs**: Architecture and feature documentation
- **Admin**: Read-only view of protocol parameters

## Tech Stack

- React + Vite + TypeScript
- Wagmi + Viem for Web3
- RainbowKit for wallet connection
- TailwindCSS for styling
- React Hook Form + Zod for form validation
- React Router for routing

## Wallet Connection

The app uses RainbowKit for wallet connection. Supported wallets:
- MetaMask
- WalletConnect
- Coinbase Wallet
- And more...

Make sure you're connected to Mantle testnet (Chain ID: 5001).

## Contract Integration

The frontend integrates with the following contracts:
- `AutonomyV1`: Main protocol contract
- `Adapter`: Yield adapter for collateral
- `AtAsset`: Debt token
- `CollateralToken`: Collateral token
- `MockOracle`: Price oracle

## Development

### Project Structure

```
web/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── lib/            # Utilities and config
│   ├── abis/           # Contract ABIs
│   └── docs/           # Documentation markdown
├── scripts/            # Build scripts
└── public/             # Static assets
```

### Adding New Features

1. Create components in `src/components/`
2. Create hooks in `src/hooks/` for contract interactions
3. Add pages in `src/pages/`
4. Update routes in `src/App.tsx`

## Troubleshooting

### ABIs not found
Run `node scripts/extract-abis.mjs` to extract ABIs from compiled contracts.

### Wallet connection issues
- Ensure you're on Mantle testnet
- Check that contract addresses are correct in `.env`
- Verify RPC URL is accessible

### Transaction failures
- Check you have sufficient MNT for gas
- Verify contract addresses are correct
- Ensure you've approved tokens if needed

## License

MIT

