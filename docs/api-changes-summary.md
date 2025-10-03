# API Routes - Smart Contract Integration Summary

## Changes Made

This document summarizes the changes made to integrate the API routes with the Solana Anchor smart contract for the Vulnera bug bounty platform.

## Smart Contract Analysis

The smart contract (`lib.rs`) implements three main functions:

1. **initialize** - Creates PDA-based escrow accounts with seeds `[b"bounty-escrow", owner.key()]`
2. **process_payment** - Handles payment distribution with automatic 2% platform fee
3. **close_bounty** - Returns remaining escrow funds to owner

### Key Parameters Backend Must Provide:
- `reward_per_submission` - Base reward amount
- `max_submissions` - Maximum number of payouts allowed
- `current_paid_submissions` - Current count of paid submissions

## Updated Files

### 1. `/src/lib/solana.ts`
**Changes:**
- Added `PROGRAM_ID` constant from smart contract
- Changed `MIN_ESCROW_AMOUNT` to use lamports (100,000,000)
- Added `deriveEscrowAddress()` method for PDA derivation
- Updated `createEscrow()` to return derived PDA address instead of creating transaction
- Added `getEscrowData()` to read on-chain escrow account data
- Added `verifyEscrowBalance()` to check escrow has sufficient funds
- Added `getEscrowBalance()` helper method
- Removed placeholder transaction methods (frontend will sign transactions)

### 2. `/src/app/api/blockchain/create-escrow/route.ts`
**Changes:**
- Removed `bountyId` from schema (not needed at this stage)
- Changed amount parameter to accept lamports directly
- Updated response to return derived PDA address
- Added message indicating frontend should sign transaction
- Removed `txSignature` from response (transaction not sent by backend)

### 3. `/src/app/api/blockchain/release-payment/route.ts`
**Changes:**
- Completely restructured to fetch submission and bounty data
- Added authentication and permission checks
- Added validation for submission status and payment state
- Calculates `currentPaidSubmissions` by querying database
- Validates max submissions limit
- Verifies escrow has sufficient balance
- Returns all parameters needed for smart contract `process_payment` call
- Includes owner wallet, hunter wallet, and platform wallet addresses
- No longer attempts to send transaction (frontend responsibility)

### 4. `/src/app/api/blockchain/withdraw-escrow/route.ts`
**Changes:**
- Added authentication and permission checks
- Removed `escrowAddress` and `ownerWallet` from request body
- Fetches bounty data to get escrow address and company wallet
- Validates bounty is closed before allowing withdrawal
- Gets remaining balance from on-chain escrow data
- Returns parameters needed for smart contract `close_bounty` call

### 5. `/src/app/api/bounties/[bountyId]/fund/route.ts`
**Changes:**
- Added `solanaService` import for blockchain verification
- Added transaction verification after receiving `txSignature`
- Verifies escrow account exists on-chain using `getEscrowData()`
- Validates escrow owner matches company wallet
- Validates escrow amount is sufficient for bounty
- Updates company stats (totalBountiesFunded, activeBounties)
- Creates audit log for funding action
- Returns escrow amount in response

### 6. `/src/app/api/bounties/[bountyId]/close/route.ts`
**Changes:**
- Added transaction verification for close transaction
- Calls `getTransaction()` to verify transaction details
- Calculates withdrawn amount by checking escrow balance difference
- Creates audit log for closing action
- Returns withdrawn amount in response

### 7. `/src/app/api/submissions/[submissionId]/approve/route.ts`
**Changes:**
- Removed `paidOut` increment from bounty update (payment not processed yet)
- Updated notification message to mention blockchain payment
- Added audit log creation for approval
- Changed response to indicate payment needs to be processed separately

### 8. `/src/app/api/payments/confirm/route.ts` (NEW)
**Purpose:** Confirm payment after `process_payment` transaction is sent

**Features:**
- Verifies transaction on blockchain
- Creates payment record in database
- Updates submission with payment ID
- Updates user earnings and total bounties
- Updates company stats (totalBountiesPaid, resolvedVulnerabilities)
- Updates bounty paidOut amount
- Creates notification for hunter
- Creates audit log
- Prevents double-payment

### 9. `/src/lib/blockchain-helpers.ts` (NEW)
**Purpose:** Utility functions for blockchain operations

**Functions:**
- `isValidPublicKey()` - Validate Solana address format
- `deriveEscrowAddress()` - Derive PDA address
- `solToLamports()` / `lamportsToSol()` - Unit conversions
- `calculatePlatformFee()` / `calculateNetAmount()` - Fee calculations
- `isValidEscrowAmount()` - Validate minimum escrow
- `formatTxSignature()` - Format signature for display
- `getExplorerUrl()` / `getAddressExplorerUrl()` - Generate explorer links
- `isValidTxSignature()` - Validate signature format
- `estimateTransactionFee()` - Estimate transaction costs
- `validatePaymentParams()` - Validate payment parameters
- `formatSol()` / `formatUsd()` - Amount formatting

### 10. `/docs/smart-contract-integration.md` (NEW)
**Purpose:** Complete integration guide

**Contents:**
- Smart contract overview
- Detailed API flow for all operations
- Frontend integration examples
- Error handling guide
- Security considerations
- Environment variables
- Testing checklist
- Event parsing examples

### 11. `/src/app/api/auth/session/route.ts` (NEW)
**Purpose:** Return the current NextAuth session

### 12. `/src/app/api/companies/my-company/route.ts` (NEW)
**Purpose:** Fetch the current user's active company details

### 13. `/src/app/api/bounties/[bountyId]/status/route.ts` (NEW)
**Purpose:** Update bounty status independently (DRAFT, ACTIVE, CLOSED, EXPIRED)

## API Flow Summary

### Creating and Funding a Bounty
```
1. POST /api/bounties → Create bounty in DB
2. POST /api/blockchain/create-escrow → Get PDA address
3. [Frontend] Call contract.initialize() → Create escrow on-chain
4. POST /api/bounties/{id}/fund → Verify and update DB
```

### Processing a Payment
```
1. POST /api/submissions/{id}/approve → Approve submission
2. POST /api/blockchain/release-payment → Get payment params
3. [Frontend] Call contract.process_payment() → Transfer funds
4. POST /api/payments/confirm → Verify and update DB
```

### Closing a Bounty
```
1. POST /api/bounties/{id}/close → Close in DB
2. POST /api/blockchain/withdraw-escrow → Get withdrawal params
3. [Frontend] Call contract.close_bounty() → Withdraw funds
```

### Session and Company Context
```bash
GET /api/auth/session    # Retrieve current session
GET /api/companies/my-company   # Retrieve current user's company
```

### Status Management
```bash
PATCH /api/bounties/{id}/status   # Update bounty status (e.g., DRAFT→ACTIVE)
```

## Database Schema Updates Required

No schema changes needed! All existing fields support the integration:
- `Bounty.escrowAddress` - Stores PDA address
- `Bounty.txSignature` - Stores initialize transaction
- `Payment.txSignature` - Stores payment transaction
- `Payment.blockchainConfirmed` - Tracks confirmation status

## Environment Variables Needed

```env
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=e42d89fc-e7b5-4048-9994-fe074264ca49
NEXT_PUBLIC_PROGRAM_ID=3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp
PLATFORM_WALLET=<your_platform_wallet_address>
```

## Security Improvements

1. **PDA-based escrow** - Prevents unauthorized access to funds
2. **Transaction verification** - All blockchain transactions verified before DB updates
3. **Permission checks** - All routes verify user has proper company permissions
4. **Balance checks** - Verifies escrow has sufficient funds before payment
5. **Double-payment prevention** - Checks prevent processing payment twice
6. **Audit logging** - All critical operations logged for accountability

## Testing Recommendations

1. Test escrow creation with valid/invalid amounts
2. Test funding with confirmed/unconfirmed transactions
3. Test payment with sufficient/insufficient escrow balance
4. Test payment with max submissions limit
5. Test double-payment prevention
6. Test withdrawal after closing bounty
7. Test permission checks for all operations
8. Test with multiple submissions per bounty

## Frontend Integration Points

The frontend needs to:
1. Connect to Solana wallet
2. Initialize Anchor program with IDL
3. Call smart contract functions with parameters from API
4. Handle transaction signing and sending
5. Wait for confirmation
6. Call confirmation APIs with transaction signatures

## Migration Path

If you have existing bounties:
1. Existing bounties without escrow addresses can continue as-is
2. New bounties must go through escrow creation flow
3. Consider adding migration script to mark old bounties as legacy

## Notes

- All amounts in API should be in SOL for user-facing endpoints
- Convert to lamports when calling smart contract
- Smart contract handles platform fee automatically (2%)
- Frontend is responsible for signing and sending all transactions
- Backend only verifies transactions and updates database
- Transaction signatures are stored for audit trail
