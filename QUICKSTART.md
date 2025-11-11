# Quick Start Guide - Autonomy Finance v1

## What Has Been Built

A complete v1 MVP version of the self-repaying lending protocol for Mantle. Here's what's included:

### ✅ Core Smart Contracts

1. **AutonomyV1** - Main protocol contract
2. **Adapter** - Yield adapter for testing
3. **AtAsset** - Debt token (atUSD)
4. **CollateralToken** - Test collateral token
5. **Base Utilities** - Errors, SafeMath, FixedPointMath, SafeERC20

### ✅ Testing

- Comprehensive test suite in `test/AutonomyV1.t.sol`
- Tests cover: deposit, mint, harvest, withdraw, repay, liquidation

### ✅ Deployment Scripts

- Ready-to-use deployment script for Mantle testnet

## Setup Instructions

### 1. Install Foundry (if not already installed)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Install Dependencies

```bash
forge install foundry-rs/forge-std --no-commit
```

### 3. Build the Project

```bash
forge build
```

### 4. Run Tests

```bash
forge test -vvv
```

### 5. Deploy to Mantle Testnet

1. Create a `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
```

2. Deploy:
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.testnet.mantle.xyz \
  --broadcast \
  --verify \
  -vvvv
```

## How It Works

### Basic User Flow

1. **Deposit Collateral**
   ```solidity
   autonomy.deposit(yieldToken, 1000e18, user);
   ```

2. **Mint Debt (atUSD)**
   ```solidity
   autonomy.mint(atAsset, 500e18, user);
   ```

3. **Yield Accrues Automatically**
   - Exchange rate increases over time
   - Collateral value grows
   - Debt effectively reduces

4. **Harvest Yield** (keeper function)
   ```solidity
   autonomy.harvest(yieldToken);
   ```

5. **Withdraw or Repay**
   ```solidity
   autonomy.withdraw(yieldToken, shares, user);
   autonomy.repay(atAsset, amount, user);
   ```

## Key Parameters

- **Minimum Collateralization**: 150%
- **Liquidation Threshold**: 120%
- **Liquidation Bonus**: 10%
- **Mock APY**: 10% (configurable)

## Design Philosophy

### Clean v1 Base:
- ✅ Single yield adapter (easy to replace with real one)
- ✅ Direct account-based positions (no NFTs)
- ✅ Simplified liquidation logic
- ✅ Direct mint/burn of debt tokens
- ✅ Minimal, focused implementation

### Core Features:
- ✅ Core lending/borrowing logic
- ✅ Collateralization checks
- ✅ Self-repaying mechanism
- ✅ Yield accrual system

## Next Steps

### Immediate:
1. Review the contracts in `src/`
2. Run the test suite
3. Deploy to Mantle testnet
4. Test the deployed contracts

### Short-term:
1. **Frontend**: Build React UI with Wagmi/Ethers.js
2. **Real Adapter**: Replace adapter with actual Mantle yield source
3. **Multi-collateral**: Add support for multiple collateral types

### Long-term:
1. Security audit
2. Governance system
3. Oracle integration for price feeds
4. Mainnet deployment

## File Structure Reference

```
src/
├── base/                    # Utilities
│   ├── Errors.sol
│   ├── SafeCast.sol
│   ├── FixedPointMath.sol
│   └── SafeERC20.sol
├── interfaces/              # Interfaces
│   ├── IAutonomyV1.sol
│   ├── ITokenAdapter.sol
│   └── IERC20*.sol
├── adapters/                # Yield adapters
│   └── Adapter.sol
├── tokens/                  # Token contracts
│   ├── AtAsset.sol
│   ├── CollateralToken.sol
│   └── MintableBurnableERC20.sol
└── core/                    # Core protocol
    └── AutonomyV1.sol

test/
└── AutonomyV1.t.sol         # Test suite

script/
└── Deploy.s.sol             # Deployment script
```

## Support

For questions or issues:
1. Check `ARCHITECTURE.md` for detailed documentation
2. Review test files for usage examples
3. Check contract comments for function documentation

## Important Notes

⚠️ **This is a v1 MVP for testing purposes**
- Adapter is for testing only
- Replace with real yield source before production
- Security audit required before mainnet
- Clean, minimal base version

✅ **Ready for Mantle Testnet**
- All contracts compile successfully
- Tests pass
- Deployment script ready
- Gas-optimized for Mantle

Happy building! 🚀
