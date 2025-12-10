# Autonomy Finance

A decentralized lending and borrowing protocol with **Story Protocol IP Collateral + Royalty-Driven Auto-Repay** integration.

## Features

- 🏦 **Multi-Asset Lending**: Supply and borrow USDC, USDT, DAI, WETH, WBTC, and more
- ⚡ **E-Mode (Efficiency Mode)**: Higher LTV for correlated assets (e.g., 97% for stablecoins)
- 🎨 **IP Collateral**: Lock Story Protocol IP assets as collateral
- 💰 **Royalty Auto-Repay**: Automatically repay loans using IP royalties with DEX conversion
- 🔄 **Token Conversion**: Built-in Uniswap integration with slippage protection
- 🎭 **Royalty Simulator**: Simulate derivative revenue distribution for Story Protocol IPs

## Supported Networks

Autonomy Finance supports the following networks:

| Network | Chain ID | RPC URL | Explorer | Status |
|---------|----------|---------|----------|--------|
| **Story Aeneid Testnet** | 1315 | https://aeneid.storyrpc.io | https://aeneid.storyscan.io | ✅ Active |

---

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

### Frontend

```bash
cd frontend

# Type check
npm run build

# Lint
npm run lint
```

- **Smart Contracts**: Solidity 0.8.24, Foundry
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Testing**: Foundry (Solidity), Vitest (TypeScript)

## License

MIT
