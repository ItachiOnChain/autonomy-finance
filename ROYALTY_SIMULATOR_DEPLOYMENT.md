# Royalty Simulator Deployment Log

## Deployment Information

**Network**: Story Aeneid Testnet  
**Chain ID**: 1513  
**RPC URL**: https://aeneid.storyrpc.io  
**Explorer**: https://aeneid.storyscan.io  
**Deployment Date**: 2024-12-09  
**Deployer Address**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  

## Deployed Contracts

### MockERC20
- **Address**: `0x242e50f40E771da8F19aAF1b813658A8562B2ad2`
- **Purpose**: Mintable ERC20 token for simulating royalty payments
- **Decimals**: 18
- **Symbol**: MRT
- **Name**: Mock Royalty Token

### RoyaltyDistributor
- **Address**: `0x366FDba679A8ece0567C1aFFC8C543f6FE9964d5`
- **Purpose**: Core simulator managing IP registration and revenue distribution
- **Features**:
  - IP registration with royalty percentages (0-100%)
  - Revenue distribution to IP owners
  - Lending pool integration support
  - Event logging for all distributions

## Deployment Transactions

Transaction details can be found in:
```
contracts/broadcast/DeployRoyaltySimulator.s.sol/1315/run-latest.json
```

## Frontend Integration

### ABI Files
- `frontend/src/abis/MockERC20.json`
- `frontend/src/abis/RoyaltyDistributor.json`

### Constants File
- `frontend/src/constants/royaltySimulator.ts`

Contract addresses have been updated in the frontend constants file.

## Verification

To verify contracts on Aeneid explorer:
```bash
forge verify-contract \
  --chain-id 1513 \
  --compiler-version v0.8.24 \
  0x242e50f40E771da8F19aAF1b813658A8562B2ad2 \
  src/story/MockERC20.sol:MockERC20 \
  --constructor-args $(cast abi-encode "constructor(address)" "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

forge verify-contract \
  --chain-id 1513 \
  --compiler-version v0.8.24 \
  0x366FDba679A8ece0567C1aFFC8C543f6FE9964d5 \
  src/story/RoyaltyDistributor.sol:RoyaltyDistributor \
  --constructor-args $(cast abi-encode "constructor(address)" "0x242e50f40E771da8F19aAF1b813658A8562B2ad2")
```

## Testing

### Unit Tests
All tests passing (26/26):
- MockERC20Test: 11/11 ✓
- RoyaltyDistributorTest: 15/15 ✓

### Smoke Check
Run smoke check to verify deployed contracts:
```bash
cd contracts
forge script script/SmokeCheck.s.sol --rpc-url https://aeneid.storyrpc.io
```

## Usage

### Mint Mock Tokens (Dev/Demo)
```bash
cast send 0x242e50f40E771da8F19aAF1b813658A8562B2ad2 \
  "mint(address,uint256)" \
  <YOUR_ADDRESS> \
  1000000000000000000000 \
  --rpc-url https://aeneid.storyrpc.io \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### Register IP
```bash
cast send 0x366FDba679A8ece0567C1aFFC8C543f6FE9964d5 \
  "registerIp(string,address,uint256,address)" \
  "0x1234..." \
  <OWNER_ADDRESS> \
  10 \
  0x0000000000000000000000000000000000000000 \
  --rpc-url https://aeneid.storyrpc.io \
  --private-key $DEPLOYER_PRIVATE_KEY
```

## Notes

- Minter role granted to RoyaltyDistributor for automated token minting
- All contracts use SafeERC20 for secure token transfers
- ReentrancyGuard implemented on distributeRevenue function
- Full event logging for transparency and debugging
