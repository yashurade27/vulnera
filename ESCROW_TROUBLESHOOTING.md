# Escrow Creation Troubleshooting Guide

## Common Issues and Solutions

### 1. **"Cannot connect wallet" or "Wallet adapter not found"**

**Symptoms:**
- Wallet connect button doesn't work
- "Plugin Closed" error
- Wallet adapter shows as undefined

**Solutions:**
- Ensure you have a Solana wallet extension installed (Phantom, Solflare, etc.)
- Refresh the page and try reconnecting
- Clear browser cache and cookies
- Try a different browser or incognito mode

### 2. **"Session authentication failed"**

**Symptoms:**
- "Please ensure you are logged in" error
- Session status shows as unauthenticated

**Solutions:**
- Log out and log back in
- Check if your session has expired
- Ensure cookies are enabled for the domain

### 3. **"Connected wallet does not match company wallet"**

**Symptoms:**
- Different wallet address connected than registered
- Cannot proceed to funding step

**Solutions:**
- Connect the same wallet that was registered with your company
- Update your company's wallet address in settings if needed
- Ensure you're using the correct wallet account

### 4. **"Insufficient balance in wallet"**

**Symptoms:**
- Balance check fails during escrow creation
- Error shows required vs available lamports

**Solutions:**
- Ensure your wallet has enough SOL for the escrow amount + transaction fees
- Note: You need at least 0.1 SOL minimum + transaction fees (~0.001 SOL)
- Transfer more SOL to your wallet if needed

### 5. **"Program not found" or "Anchor program errors"**

**Symptoms:**
- Program ID not found errors
- Anchor provider/program initialization fails

**Solutions:**
- Check if you're on the correct Solana network (devnet/mainnet)
- Verify the program ID is deployed and valid
- Try refreshing the page to re-initialize the connection

### 6. **"Transaction timeout" or "Blockhash not found"**

**Symptoms:**
- Transaction fails after wallet confirmation
- "Blockhash not found" errors

**Solutions:**
- Network congestion - wait and try again
- Ensure your RPC endpoint is responsive
- Try switching to a different RPC endpoint

### 7. **"PDA derivation failed" or "Invalid escrow address"**

**Symptoms:**
- Cannot derive program address
- Escrow address validation fails

**Solutions:**
- Check that program ID is correct
- Ensure wallet is properly connected
- Verify the seed derivation matches the program

## Debug Information

The create bounty page now includes a debug panel that shows real-time logs. To access it:

1. Go to `/dashboard/company/bounties/create`
2. Fill out the bounty form
3. Try to create the bounty
4. If there are issues, scroll down to see the "Debug Information" section
5. Expand it to see detailed logs
6. Copy the debug logs and include them when reporting issues

## Debug Log Interpretation

### Key Debug Steps to Watch:
- `WALLET_STATE_CHANGE` - Tracks wallet connection status
- `INITIALIZATION_START` - Shows initial validation checks  
- `BOUNTY_CREATION_START/RESPONSE` - API call to create bounty record
- `ESCROW_DERIVATION_START/RESPONSE` - API call to derive escrow address
- `PDA_DERIVATION` - Client-side PDA derivation
- `ACCOUNT_INFO_CHECK` - Checks if escrow account already exists
- `INITIALIZING_VAULT/DEPOSITING_TO_VAULT` - Blockchain transaction type
- `TRANSACTION_SUCCESS/ERROR` - Blockchain transaction result
- `FUNDING_VERIFICATION_START/RESPONSE` - Backend verification of transaction

### Common Error Patterns:

**Authentication Issues:**
```json
{
  "step": "AUTH_ERROR", 
  "data": { "sessionStatus": "unauthenticated" }
}
```

**Wallet Connection Issues:**
```json
{
  "step": "WALLET_ERROR",
  "data": { "connected": false, "hasPublicKey": false }
}
```

**Insufficient Balance:**
```json
{
  "step": "ESCROW_DERIVATION_RESPONSE",
  "data": { 
    "ok": false, 
    "response": { "error": "Insufficient balance in wallet" }
  }
}
```

**Transaction Failures:**
```json
{
  "step": "TRANSACTION_ERROR",
  "data": { 
    "error": "User rejected the request",
    "name": "WalletSignTransactionError"
  }
}
```

## Environment-Specific Issues

### Development (devnet)
- Ensure you have devnet SOL in your wallet
- Get devnet SOL from faucets: 
  - https://faucet.solana.com/
  - https://solfaucet.com/

### Production (mainnet)
- Ensure you have real SOL in your wallet
- Transaction fees are higher on mainnet
- Network congestion can cause delays

## Getting Help

If you encounter issues:

1. **Capture debug logs** from the debug panel
2. **Note the exact error message** displayed to the user
3. **Include your wallet address** (for balance/transaction verification)
4. **Specify which network** you're using (devnet/mainnet)
5. **Include browser and wallet extension versions**

### Useful Information to Include:
- Wallet type (Phantom, Solflare, etc.)
- Browser (Chrome, Firefox, Safari, etc.)
- Operating system
- Network connection status
- Whether this is your first time creating a bounty or if it worked before

## Manual Verification Steps

If the UI is not working, you can manually verify:

1. **Check wallet balance:**
   ```bash
   solana balance <wallet_address> --url <rpc_endpoint>
   ```

2. **Check transaction status:**
   ```bash
   solana confirm <transaction_signature> --url <rpc_endpoint>
   ```

3. **Check program account:**
   ```bash
   solana account <program_id> --url <rpc_endpoint>
   ```

## Emergency Procedures

### If Funds Are Stuck in Escrow:
1. Note the escrow address from debug logs
2. Note the transaction signature
3. Contact support with this information
4. Do not create additional escrows until the issue is resolved

### If Bounty Creation Succeeds But Funding Fails:
1. The bounty record exists but is unfunded
2. You can try the funding step again from the bounty details page
3. Or create a new bounty (the old one will remain unfunded)

## Contact Information

For technical support:
- Include debug logs from the debug panel
- Provide wallet address and transaction signatures
- Describe the exact steps that led to the issue