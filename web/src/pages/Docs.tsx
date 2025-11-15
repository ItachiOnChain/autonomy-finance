import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { FileText, Book, Shield, Rocket } from 'lucide-react'

const architectureContent = `# Autonomy Finance - Architecture Documentation

## Overview

Autonomy Finance is a self-repaying lending and borrowing protocol for Mantle blockchain. This v1 MVP version provides the core functionality for users to deposit collateral, mint debt tokens (atAssets), and have their debt automatically repaid through yield accrual.

## Core Components

### 1. AutonomyV1

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

### 2. Adapter

A yield adapter for MVP testing that:
- Simulates yield accrual through a configurable APY
- Manages exchange rate between underlying tokens and yield tokens
- Automatically compounds yield over time
- Provides \`pokeYield()\` function to manually trigger yield updates

**Configuration:**
- Initial Exchange Rate: 1:1 (1e18)
- Configurable APY (default: 10% = 0.1e18)

### 3. Token Contracts

#### AtAsset
- Debt token representing self-repaying loans
- Mintable by AutonomyV1
- Burnable by users for repayment

#### CollateralToken
- Mock collateral token for testing
- Can be minted by anyone for testing purposes

## Architecture Flow

### Deposit Flow
1. User approves AutonomyV1 to spend collateral tokens
2. User calls \`deposit(yieldToken, amount, recipient)\`
3. AutonomyV1 transfers collateral to adapter
4. Adapter mints yield tokens to AutonomyV1
5. AutonomyV1 tracks user's deposited shares

### Mint Flow
1. User must have deposited collateral first
2. User calls \`mint(debtToken, amount, recipient)\`
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
1. Keeper calls \`harvest(yieldToken)\`
2. Adapter updates exchange rate based on time elapsed
3. Yield is applied to reduce effective debt
4. Exchange rate increases, increasing collateral value

### Withdraw Flow
1. User calls \`withdraw(yieldToken, shares, recipient)\`
2. AutonomyV1 checks if withdrawal maintains ≥150% collateralization
3. If valid, AutonomyV1 burns yield tokens
4. Adapter returns underlying tokens to recipient

### Repay Flow
1. User approves AutonomyV1 to burn atAsset tokens
2. User calls \`repay(debtToken, amount, recipient)\`
3. AutonomyV1 burns atAsset tokens
4. User's debt is reduced

### Liquidation Flow
1. Position falls below 120% collateralization
2. Liquidator calls \`liquidate(account, yieldToken, shares)\`
3. Liquidator repays debt tokens (gets 10% bonus)
4. Liquidator receives liquidated collateral
`

const rwaContent = `# RWA Adapter Overview

## Introduction

The RWA (Real World Assets) Adapter extends Autonomy Finance to support tokenized real-world assets with NAV (Net Asset Value) based pricing instead of on-chain APY.

## Key Differences from Standard Adapter

### Standard Adapter
- Uses on-chain APY calculation
- Exchange rate compounds automatically over time
- Yield accrues continuously based on time elapsed

### RWA Adapter
- Uses NAV (Net Asset Value) from an oracle
- NAV updates happen off-chain
- Exchange rate = NAV (1:1 relationship)
- Supports instant redemption from liquidity buffer
- Queues redemptions when buffer is insufficient

## Features

### NAV-Based Pricing
- Exchange rate is determined by the RWA Oracle's NAV
- NAV represents the underlying asset value per share
- NAV updates are performed off-chain by authorized keepers

### Liquidity Buffer
- Maintains a buffer of underlying tokens for instant redemptions
- Users can withdraw instantly if buffer has sufficient liquidity
- When buffer is depleted, redemptions are queued

### Redemption Queue
- Redemptions that exceed buffer capacity are queued
- Queue is processed by owner/keeper
- Each redemption request has a unique ID and timestamp

### Status Management
- **Active**: Normal operation, deposits and withdrawals allowed
- **RedeemOnly**: Only withdrawals allowed, no new deposits
- **Blocked**: Emergency state, only emergency withdrawals allowed
`

const securityContent = `# Security Considerations

## Access Control

### Owner Functions
- Protocol parameters can only be updated by the contract owner
- Oracle and whitelist can be updated by owner
- Yield tokens and debt tokens can be registered by owner
- Functions can be paused/unpaused by owner

### Whitelist (Optional)
- If a whitelist contract is set, only whitelisted addresses can interact
- Whitelist check is performed via \`staticcall\` to the whitelist contract
- Whitelist can be disabled by setting it to address(0)

## Pause Mechanism

### Function-Level Pauses
- Individual functions can be paused using function selectors
- Paused functions revert with \`Paused()\` error
- Allows granular control over protocol operations

### Emergency Withdraw
- Adapters support emergency withdraw function
- Only available when adapter is in \`Blocked\` or \`RedeemOnly\` status
- Owner-only function for emergency situations

## Collateralization Checks

### Minimum Collateralization
- 150% minimum collateralization ratio enforced
- Prevents users from minting debt that would make them undercollateralized
- Withdrawals check that position remains above 150%

### Liquidation Threshold
- Positions below 120% collateralization can be liquidated
- Protects protocol from bad debt
- Liquidators receive up to 10% bonus

## Reentrancy Protection

- All state-changing functions use \`nonReentrant\` modifier
- SafeERC20 library used for all token transfers
- No external calls before state updates
`

const mvpDemoContent = `# MVP Demo Script

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
`

const docs = [
  { id: 'architecture', title: 'Architecture', icon: Book, content: architectureContent },
  { id: 'rwa', title: 'RWA Adapter', icon: FileText, content: rwaContent },
  { id: 'security', title: 'Security', icon: Shield, content: securityContent },
  { id: 'demo', title: 'Demo Script', icon: Rocket, content: mvpDemoContent },
]

export default function Docs() {
  const [activeDoc, setActiveDoc] = useState(docs[0])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Documentation</h1>
        <p className="text-muted-foreground">Learn about Autonomy Finance architecture and features</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-2">
            {docs.map((doc) => {
              const Icon = doc.icon
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`w-full text-left px-4 py-3 rounded-md flex items-center gap-2 transition-colors ${
                    activeDoc.id === doc.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {doc.title}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="prose prose-slate dark:prose-invert max-w-none rounded-lg border border-border bg-card p-8">
            <ReactMarkdown>{activeDoc.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

