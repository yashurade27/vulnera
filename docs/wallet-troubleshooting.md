# Wallet Connection Troubleshooting Guide

This guide helps debug wallet connection issues on Vercel deployments.

## Common Errors

### 1. "origins don't match" (Vercel Live)

**Error Message:**
```
origins don't match https://vercel.live https://vulnera-git-yash-yashs-projects-318f9f15.vercel.app
```

**What it means:**
- This is a **non-critical warning** from Vercel's Live Preview feature
- It does NOT affect wallet functionality
- The warning is automatically suppressed in the console

**Solution:**
- No action needed - this is expected on Vercel deployments
- The warning suppression is active via `src/lib/suppress-warnings.ts`

---

### 2. "Plugin Closed" / Wallet Connection Error

**Error Message:**
```
WalletConnectionError: Plugin Closed
```

**What it means:**
- User closed the wallet popup without approving/rejecting
- User cancelled the connection request
- Wallet browser extension crashed

**Solution:**
1. Ensure wallet extension is installed and unlocked
2. Try connecting again
3. Check browser console for actual errors (user cancellations are now filtered)

**Debugging Steps:**
```javascript
// Check wallet state in console:
console.log('[WalletDropdown] State:', {
  connected,
  hasAccount: !!account,
  walletName: wallet?.name
})
```

---

### 3. NextAuth Session Errors

**Error Message:**
```
[next-auth][error][CLIENT_FETCH_ERROR] Cannot convert undefined or null to object
```

**What it means:**
- Missing environment variables on Vercel
- Session provider not properly configured
- Database connection issues

**Solution:**

1. **Check Environment Variables on Vercel:**
   ```
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   DATABASE_URL=your-postgres-url
   ```

2. **Verify in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Ensure all variables are set for Production/Preview
   - Redeploy after adding variables

3. **Check SessionProvider Configuration:**
   ```tsx
   <SessionProvider 
     basePath="/api/auth" 
     refetchInterval={0}
     refetchOnWindowFocus={false}
   >
   ```

---

### 4. Wallet Address Mismatch

**Error Message:**
```
Connected wallet does not match the company wallet on file
```

**What it means:**
- You're connected with a different wallet than registered
- Company profile has wallet address A, but you're using wallet B

**Solution:**
1. Check company wallet address in database
2. Connect with the correct wallet
3. Or update company wallet address in settings

---

## Logging & Debugging

### Enable Debug Logs

All wallet operations now have comprehensive logging:

```javascript
// Wallet state changes
[CreateBounty] Wallet state changed: { connected: true, publicKey: "..." }

// Connection attempts
[WalletDropdown] Attempting to connect to: Phantom

// User actions
[WalletDropdown] User cancelled connection to: Phantom

// Errors (filtered)
[Wallet Error] { message: "...", name: "WalletError" }
```

### View Logs in Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Filter by:
   - `[Wallet` - wallet-related logs
   - `[CreateBounty]` - bounty creation logs
   - `[SolanaProvider]` - provider initialization

### Debug Wallet Provider State

Add to your component:
```tsx
useEffect(() => {
  console.log('Wallet State:', {
    connected,
    publicKey: publicKey?.toBase58(),
    hasProgram: !!program
  })
}, [connected, publicKey, program])
```

---

## Production Checklist

Before deploying:

- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Verify `DATABASE_URL` is correct
- [ ] Test wallet connection on preview deployment
- [ ] Check browser console for actual errors (ignore Vercel Live warnings)
- [ ] Ensure wallet extension is updated

---

## Environment Variables

**Required for Vercel:**

```bash
# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Solana (optional - defaults exist)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Generate Secret:**
```bash
openssl rand -base64 32
```

Or use online tool: https://generate-secret.vercel.app/32

---

## Testing Wallet Connection

1. **Test on Preview Deployment:**
   ```bash
   git push origin yash
   # Wait for Vercel deployment
   # Visit preview URL
   ```

2. **Test Flow:**
   - Click "Connect Wallet"
   - Select wallet (Phantom/Solflare)
   - Approve connection
   - Check console for `[WalletDropdown] Successfully connected`

3. **Test Bounty Creation:**
   - Navigate to `/dashboard/company/bounties/create`
   - Fill form
   - Check wallet state logs
   - Attempt funding

---

## Common Fixes

### Reset Wallet Connection

```typescript
// In browser console:
localStorage.clear()
// Refresh page
```

### Clear Session

```typescript
// In browser console:
await fetch('/api/auth/signout', { method: 'POST' })
// Refresh page
```

### Reconnect Wallet

1. Click wallet dropdown
2. Click "Disconnect"
3. Refresh page
4. Click "Select Wallet"
5. Choose wallet and connect

---

## Support

If issues persist:

1. Check logs: `[Wallet Error]` messages
2. Verify environment variables
3. Test with different wallet (Phantom vs Solflare)
4. Try incognito/private browsing
5. Check wallet extension version

**Key Files:**
- `src/components/solana/solana-provider.tsx` - Wallet provider setup
- `src/components/wallet-dropdown.tsx` - Wallet UI component
- `src/lib/suppress-warnings.ts` - Error suppression
- `src/components/app-providers.tsx` - Provider hierarchy
