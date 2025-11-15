# Security Considerations

## Access Control

### Owner Functions
- Protocol parameters can only be updated by the contract owner
- Oracle and whitelist can be updated by owner
- Yield tokens and debt tokens can be registered by owner
- Functions can be paused/unpaused by owner

### Whitelist (Optional)
- If a whitelist contract is set, only whitelisted addresses can interact
- Whitelist check is performed via `staticcall` to the whitelist contract
- Whitelist can be disabled by setting it to address(0)

## Pause Mechanism

### Function-Level Pauses
- Individual functions can be paused using function selectors
- Paused functions revert with `Paused()` error
- Allows granular control over protocol operations

### Emergency Withdraw
- Adapters support emergency withdraw function
- Only available when adapter is in `Blocked` or `RedeemOnly` status
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

- All state-changing functions use `nonReentrant` modifier
- SafeERC20 library used for all token transfers
- No external calls before state updates

## Oracle Security

### Price Oracle
- Price oracle provides token prices in debt token units
- Mock oracle for MVP (should be replaced with production oracle)
- Oracle updates should be monitored for staleness

### RWA Oracle
- NAV updates must be performed by authorized keepers
- Staleness checks prevent using outdated NAV values
- NAV staleness is checked before critical operations

## Risk Notes

### Smart Contract Risk
- Contracts are unaudited in MVP version
- Users should only deposit funds they can afford to lose
- Protocol parameters can be changed by owner

### Oracle Risk
- Price oracle failures could affect protocol operations
- Stale prices could lead to incorrect collateralization calculations
- RWA NAV staleness could prevent withdrawals

### Liquidation Risk
- Positions below 120% can be liquidated
- Users should monitor their health factor
- Consider depositing more collateral or repaying debt if health factor is low

### Yield Risk
- Yield is not guaranteed
- Adapter APY is configurable and can be changed
- RWA NAV can decrease, reducing collateral value

