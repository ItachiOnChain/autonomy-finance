# Autonomy Finance - Architecture Documentation

## Overview

Autonomy Finance is a self-repaying lending and borrowing protocol for Mantle blockchain. This v1 MVP version provides the core functionality for users to deposit collateral, mint debt tokens (atAssets), and have their debt automatically repaid through yield accrual.

## Core Components

### 1. AutonomyV1 (`src/core/AutonomyV1.sol`)

The main protocol contract that manages:
- **Deposits**: Users deposit collateral tokens which are converted to yield tokens via adapters
- **Minting**: Users can mint debt tokens (atAssets) up to their collateralization limit (150% minimum)
- **Self-Repayment**: Yield accrues on deposited collateral, increasing its value and effectively reducing debt
- **Withdrawals**: Users can withdraw collateral as long as they maintain the minimum collateralization ratio
- **Liquidation**: Undercollateralized positions can be liquidated at a 120% threshold

**Key Features:**
- Minimum Collateralization Ratio: 150%
- Liquidation Threshold: 120%
- Maximum Liquidation Bonus: 10%

### 2. Adapter (`src/adapters/Adapter.sol`)

A yield adapter for MVP testing that:
- Simulates yield accrual through a configurable APY
- Manages exchange rate between underlying tokens and yield tokens
- Automatically compounds yield over time
- Provides `pokeYield()` function to manually trigger yield updates

**Configuration:**
- Initial Exchange Rate: 1:1 (1e18)
- Configurable APY (default: 10% = 0.1e18)

### 3. Token Contracts

#### AtAsset (`src/tokens/AtAsset.sol`)
- Debt token representing self-repaying loans
- Mintable by AutonomyV1
- Burnable by users for repayment

#### CollateralToken (`src/tokens/CollateralToken.sol`)
- Mock collateral token for testing
- Can be minted by anyone for testing purposes

#### MintableBurnableERC20 (`src/tokens/MintableBurnableERC20.sol`)
- Utility token used by adapters for yield tokens
- Combines mintable and burnable functionality

## Architecture Flow

### Deposit Flow
1. User approves AutonomyV1 to spend collateral tokens
2. User calls `deposit(yieldToken, amount, recipient)`
3. AutonomyV1 transfers collateral to adapter
4. Adapter mints yield tokens to AutonomyV1
5. AutonomyV1 tracks user's deposited shares

### Mint Flow
1. User must have deposited collateral first
2. User calls `mint(debtToken, amount, recipient)`
3. AutonomyV1 checks collateralization ratio (must be ≥150%)
4. If valid, AutonomyV1 mints atAsset tokens to recipient
5. User's debt is tracked

### Self-Repayment Flow
1. Yield accrues on deposited collateral through adapter
2. Exchange rate increases over time
3. User's collateral value increases
4. Debt-to-collateral ratio improves
5. User can withdraw more or mint more debt as collateral value grows

### Harvest Flow
1. Keeper calls `harvest(yieldToken)`
2. Adapter updates exchange rate based on time elapsed
3. Yield is applied to reduce effective debt
4. Exchange rate increases, increasing collateral value

### Withdraw Flow
1. User calls `withdraw(yieldToken, shares, recipient)`
2. AutonomyV1 checks if withdrawal maintains ≥150% collateralization
3. If valid, AutonomyV1 burns yield tokens
4. Adapter returns underlying tokens to recipient

### Repay Flow
1. User approves AutonomyV1 to burn atAsset tokens
2. User calls `repay(debtToken, amount, recipient)`
3. AutonomyV1 burns atAsset tokens
4. User's debt is reduced

### Liquidation Flow
1. Position falls below 120% collateralization
2. Liquidator calls `liquidate(account, yieldToken, shares)`
3. Liquidator repays debt tokens (gets 10% bonus)
4. Liquidator receives liquidated collateral

## Key Features

### Simplified Design (v1 MVP)
- Single yield adapter for testing
- Simplified liquidation logic (proportional debt repayment)
- Direct account mapping (no position NFTs)
- Direct mint/burn of debt tokens
- Clean, minimal base version

### Mantle-Specific Adaptations
- Optimized for Mantle's EVM compatibility
- Gas-efficient design for Mantle's lower gas costs
- Ready for Mantle testnet deployment

## Security Considerations

### Access Control
- Admin functions protected by `onlyAdmin` modifier
- Pause functionality for emergency stops

### Collateralization Checks
- Minimum 150% collateralization enforced on mint
- Withdrawal checks prevent undercollateralization
- Liquidation threshold at 120% protects protocol

### Reentrancy Protection
- No external calls before state updates in critical functions
- SafeERC20 library for token transfers

## Testing

Run tests with:
```bash
forge test
```

Test coverage includes:
- Deposit functionality
- Mint with collateralization checks
- Harvest and yield accrual
- Withdraw with collateralization checks
- Repay functionality
- Liquidation scenarios

## Deployment

### Prerequisites
1. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash`
2. Set up environment variables:
   ```bash
   export PRIVATE_KEY=your_private_key
   ```

### Deploy to Mantle Testnet
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.testnet.mantle.xyz --broadcast --verify
```

## File Structure

```
.
├── src/
│   ├── base/              # Base utilities (Errors, SafeCast, FixedPointMath, SafeERC20)
│   ├── interfaces/        # Interface definitions
│   ├── adapters/          # Yield adapters (Adapter)
│   ├── tokens/            # Token contracts
│   └── core/              # Core protocol (AutonomyV1)
├── test/                  # Test files
├── script/                # Deployment scripts
└── lib/                   # Dependencies (if using Foundry)
```

## Next Steps

1. **Frontend Integration**: Build React frontend with Wagmi/Ethers.js
2. **Real Yield Adapters**: Replace adapter with real Mantle yield sources
3. **Oracle Integration**: Add price feeds for multi-collateral support
4. **Governance**: Add DAO governance for parameter updates
5. **Audit**: Security audit before mainnet deployment

## License

MIT
