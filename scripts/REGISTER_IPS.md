# Batch IP Registration Script

## Purpose
Register all existing IPs in the RoyaltyDistributor contract that were minted before automatic registration was implemented.

## Prerequisites
- Node.js installed
- `DEPLOYER_PRIVATE_KEY` environment variable set
- Access to Aeneid Testnet RPC

## Usage

### Step 1: Update IP List
Edit `scripts/registerExistingIPs.ts` and update the `IPS_TO_REGISTER` array with your actual IP IDs:

```typescript
const IPS_TO_REGISTER = [
    {
        ipId: '0x1234...', // Your actual IP ID from Story Protocol
        owner: '0xabcd...', // Owner wallet address
        royaltyPercent: 49 // Royalty percentage (0-100)
    },
    // Add more IPs here
];
```

### Step 2: Run the Script

```bash
# From project root
cd /home/itachionchain/autonomy-finance

# Set environment variable
export DEPLOYER_PRIVATE_KEY="your_private_key_here"

# Run the script
npx tsx scripts/registerExistingIPs.ts
```

### Step 3: Verify Registration

The script will output:
- ✓ Successfully registered IPs
- ⊘ Already registered IPs (skipped)
- ✗ Failed registrations

Check the Aeneid explorer for transaction confirmations:
https://aeneid.storyscan.io

## How to Find Your IP IDs

### Option 1: From IP Gallery
1. Open your IP Dashboard
2. Click on an IP card
3. Copy the IP ID from the details modal

### Option 2: From Browser Console
```javascript
// In browser console on IP Dashboard
const ips = JSON.parse(localStorage.getItem('ipGallery') || '[]');
console.table(ips.map(ip => ({ ipId: ip.ipId, owner: ip.creator })));
```

### Option 3: From Story Protocol Explorer
1. Go to https://aeneid.storyscan.io
2. Search for your wallet address
3. Find IP registration transactions
4. Extract IP IDs from transaction details

## Script Features

- ✅ Checks if IP is already registered (skips if yes)
- ✅ Registers IP with owner and royalty percentage
- ✅ Waits for transaction confirmation
- ✅ Provides detailed progress output
- ✅ Summary report at the end
- ✅ Error handling for each IP

## Troubleshooting

### Error: "IP ID cannot be empty"
- Make sure IP IDs are not empty strings
- Verify IP ID format matches Story Protocol format

### Error: "Invalid owner address"
- Verify owner address is a valid Ethereum address
- Must start with "0x" and be 42 characters long

### Error: "Royalty percent must be 0-100"
- Ensure royalty percentage is between 0 and 100

### Transaction Fails
- Check you have enough IP tokens for gas
- Verify RPC endpoint is accessible
- Check contract address is correct

## After Registration

Once IPs are registered, you can:
1. Use them in the Royalty Simulator
2. Simulate revenue without "IP not registered" errors
3. Mint royalty tokens to IP owners

## Example Output

```
🚀 Starting batch IP registration...

Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
RoyaltyDistributor: 0x909B91a21d0F86709C4eec651E82A4eFB028C330

📝 Processing IP: 0x1234...
   → Registering with 49% royalty...
   → Transaction: 0xabcd...
   ✓ Registered successfully!

📝 Processing IP: 0x5678...
   ✓ Already registered, skipping

==================================================
📊 Registration Summary:
   ✓ Registered: 1
   ⊘ Skipped (already registered): 1
   ✗ Failed: 0
   📝 Total processed: 2
==================================================

✅ All IPs processed successfully!
```
