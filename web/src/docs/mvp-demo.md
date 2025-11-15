# MVP Demo Script

This document outlines the step-by-step process for recording a one-take demo of Autonomy Finance.

## Prerequisites

1. Connect wallet to Mantle testnet
2. Ensure you have testnet MNT for gas
3. Have some test collateral tokens (can be minted if using CollateralToken)

## Demo Flow

### 1. Connect Wallet
- Click "Connect Wallet" button
- Select wallet provider (MetaMask, WalletConnect, etc.)
- Switch to Mantle testnet if not already connected
- Verify connection in header

### 2. View Dashboard (Empty State)
- Navigate to Dashboard
- Show all stats at zero:
  - Collateral Deposited: $0.00
  - Total Debt: $0.00
  - Health Factor: ∞
  - Exchange Rate: 1.0000

### 3. Deposit Collateral
- Navigate to Vault page
- Click "Deposit" tab (should be active by default)
- Enter amount: 1000
- Click "Approve" (if needed)
- Wait for approval confirmation
- Click "Deposit"
- Wait for transaction confirmation
- Show updated shares in the UI
- Return to Dashboard to show:
  - Collateral Deposited: ~$1000.00
  - Health Factor: ∞ (no debt yet)

### 4. Mint atAsset
- Navigate to Borrow page
- Click "Mint" tab
- View position summary:
  - Collateral Value: ~$1000.00
  - Current Debt: $0.00
  - Health Factor: ∞
  - Max Borrowable: ~$666.67 (1000 / 1.5)
- Enter amount: 300
- Click "Mint"
- Wait for transaction confirmation
- Show updated debt in UI
- Return to Dashboard to show:
  - Collateral Deposited: ~$1000.00
  - Total Debt: ~$300.00
  - Health Factor: ~3.33

### 5. Harvest Yield (Auto-Repay Demo)
- Navigate to Harvest page
- Show current exchange rate (should be ~1.0000)
- Show APY (should be 10%)
- Click "Harvest Yield (Demo)" button
- Wait for transaction confirmation
- Show updated exchange rate (should be slightly higher)
- Return to Dashboard to show:
  - Collateral Value may have increased slightly
  - Health Factor improved (debt effectively reduced)
- Explain: "The yield accrued on our collateral has increased its value, effectively reducing our debt-to-collateral ratio. This is the self-repaying mechanism in action."

### 6. Repay Debt
- Navigate to Borrow page
- Click "Repay" tab
- View current debt amount
- Enter amount: 50
- Click "Approve" (if needed)
- Wait for approval
- Click "Repay"
- Wait for transaction confirmation
- Show updated debt (should be ~$250.00)
- Return to Dashboard to show reduced debt

### 7. Withdraw Collateral
- Navigate to Vault page
- Click "Withdraw" tab
- View deposited shares
- Enter shares amount (or click MAX)
- Click "Withdraw"
- Wait for transaction confirmation
- Show updated balances
- Return to Dashboard to show reduced collateral

### 8. View Documentation
- Navigate to Docs page
- Show Architecture section
- Briefly explain the self-repaying mechanism
- Show RWA Adapter section (if applicable)
- Mention this is an MVP version

## Key Points to Highlight

1. **Self-Repaying Mechanism**: Yield on collateral automatically reduces debt
2. **Health Factor**: Always monitor to avoid liquidation
3. **Minimum Collateralization**: 150% required to mint debt
4. **Liquidation Threshold**: 120% - positions below this can be liquidated
5. **Harvest Function**: Keeper function that triggers yield accrual and auto-repay

## Troubleshooting

- If transactions fail, check:
  - Sufficient gas (MNT balance)
  - Correct network (Mantle testnet)
  - Contract addresses are correct in .env
  - Sufficient token balances for operations

## Notes for Recording

- Speak clearly and explain each step
- Show transaction confirmations
- Highlight the auto-repay mechanism during harvest
- Emphasize security considerations (unaudited MVP)
- Mention this is a testnet deployment

