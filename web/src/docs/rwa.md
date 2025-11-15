# RWA Adapter Overview

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

## Usage Flow

### Deposit
1. User deposits underlying tokens
2. Adapter calculates shares based on current NAV
3. Yield tokens are minted to user

### Withdraw (Instant)
1. User requests withdrawal
2. If buffer has sufficient liquidity, withdrawal is instant
3. Yield tokens are burned, underlying tokens transferred

### Withdraw (Queued)
1. User requests withdrawal
2. If buffer is insufficient, request is queued
3. User receives partial amount from buffer if available
4. Remaining amount is processed later by keeper

### Process Redemption
1. Keeper processes queued redemption
2. Underlying tokens are transferred to user
3. Redemption request is marked as processed

## Security

- NAV staleness checks prevent using outdated prices
- Status management allows emergency pauses
- Owner-only functions for critical operations
- Buffer cap prevents unbounded growth

