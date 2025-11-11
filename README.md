# Autonomy Finance - Mantle MVP

A self-repaying lending and borrowing protocol for Mantle blockchain.

## Project Structure

```
.
├── src/
│   ├── base/           # Base contracts and utilities
│   ├── interfaces/     # Interface definitions
│   ├── adapters/       # Yield adapters
│   ├── tokens/         # Token contracts
│   └── core/           # Core protocol contracts
├── test/               # Test files
├── script/             # Deployment scripts
└── lib/                # Dependencies
```

## Setup

1. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash`
2. Install dependencies: `forge install`
3. Build: `forge build`
4. Test: `forge test`

## Deployment

Deploy to Mantle testnet using the scripts in `script/`.

## License

MIT
