# Smart Contract Integration Guide

## Overview

The Vulnera platform integrates with a Solana Anchor program for secure escrow-based bounty payments. This document explains how the API routes interact with the smart contract.

## Smart Contract Details

**Program ID:** `3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp`

### Contract Functions

1. **initialize** - Creates a bounty escrow with owner-specific PDA
2. **process_payment** - Releases payment from escrow to hunter with platform fee deduction
3. **close_bounty** - Returns remaining escrow funds to owner

### Key Features

- **PDA-based escrow accounts**: Each company has a unique escrow account derived from `[b"bounty-escrow", owner.key()]`
- **Platform fee**: 2% (200 basis points) automatically deducted from payments
- **Minimum escrow**: 0.1 SOL (100,000,000 lamports)
- **Safety checks**: Validates max submissions, sufficient funds, and proper ownership

## API Integration Flow

### Authentication & Session
```bash
GET /api/auth/session   # Get current session (or null if not logged in)
```

### Company Context
```bash
GET /api/companies/my-company   # Get the current user's company and permissions
```

### Bounty Status Management
```bash
PATCH /api/bounties/[bountyId]/status   # Update bounty status (DRAFT, ACTIVE, CLOSED, EXPIRED)
```

### 1. Creating and Funding a Bounty

#### Step 1: Create Bounty (Database)
```
POST /api/bounties
```
Creates bounty record in database with status ACTIVE.

#### Step 2: Get Escrow Address
```
POST /api/blockchain/create-escrow
Body: {
  "ownerWallet": "company_wallet_address",
  "amount": 100000000  // in lamports
}

Response: {
  "escrowAddress": "derived_pda_address",
  "expectedAmount": 100000000
}
```

#### Step 3: Initialize Escrow (Frontend)
The frontend should call the smart contract's `initialize` function with:
- `escrow_amount`: Amount in lamports
- Accounts:
  - `vault`: Derived PDA escrow address
  - `owner`: Company wallet (signer)
  - `system_program`: System program

#### Step 4: Confirm Funding
```
POST /api/bounties/{bountyId}/fund
Body: {
  "txSignature": "transaction_signature",
  "escrowAddress": "pda_address"
}
```

This verifies:
- Transaction is confirmed on-chain
- Escrow account exists with correct owner
- Escrow amount matches bounty reward

### 2. Processing a Payment

#### Step 1: Approve Submission (Database)
```
POST /api/submissions/{submissionId}/approve
Body: {
  "rewardAmount": "0.5"  // in SOL
}
```

Updates submission status to APPROVED.

#### Step 2: Get Payment Parameters
```
POST /api/blockchain/release-payment
Body: {
  "submissionId": "submission_id",
  "customAmount": 500000000  // optional, in lamports
}

Response: {
  "paymentParams": {
    "programId": "...",
    "bountyId": "...",
    "submissionId": "...",
    "escrowAddress": "...",
    "ownerWallet": "...",
    "hunterWallet": "...",
    "platformWallet": "...",
    "customAmount": null,
    "rewardPerSubmission": 500000000,
    "maxSubmissions": 10,
    "currentPaidSubmissions": 3
  },
  "amounts": {
    "totalAmount": 500000000,
    "hunterAmount": 490000000,
    "platformFee": 10000000
  }
}
```

#### Step 3: Process Payment (Frontend)
Call the smart contract's `process_payment` function with:
- `bounty_id`: String
- `submission_id`: String
- `custom_amount`: Option<u64>
- `reward_per_submission`: u64
- `max_submissions`: u32
- `current_paid_submissions`: u32
- Accounts:
  - `vault`: Escrow PDA (mut)
  - `owner`: Company wallet (mut, signer)
  - `hunter_wallet`: Bounty hunter wallet (mut)
  - `platform_wallet`: Platform wallet (mut)
  - `system_program`: System program

#### Step 4: Confirm Payment
```
POST /api/payments/confirm
Body: {
  "submissionId": "submission_id",
  "txSignature": "transaction_signature"
}
```

This:
- Verifies transaction on-chain
- Creates payment record
- Updates user earnings
- Updates company stats
- Sends notification to hunter

### 3. Closing a Bounty

#### Step 1: Close Bounty Status (Database)
```
POST /api/bounties/{bountyId}/close
Body: {
  "txSignature": "placeholder"  // temporary, will be updated
}
```

Validates no pending submissions exist.

#### Step 2: Get Withdrawal Parameters
```
POST /api/blockchain/withdraw-escrow
Body: {
  "bountyId": "bounty_id"
}

Response: {
  "withdrawParams": {
    "programId": "...",
    "bountyId": "...",
    "escrowAddress": "...",
    "ownerWallet": "...",
    "remainingAmount": 300000000
  }
}
```

#### Step 3: Close Bounty (Frontend)
Call the smart contract's `close_bounty` function with:
- `bounty_id`: String
- Accounts:
  - `vault`: Escrow PDA (mut)
  - `owner`: Company wallet (mut, signer)
  - `system_program`: System program

#### Step 4: Update Closure (if needed)
The close route already handles transaction verification when provided.

## Error Handling

### Smart Contract Errors

- **InsufficientFunds**: Escrow doesn't have enough balance
- **Overflow/Underflow**: Arithmetic errors
- **InvalidEscrowAmount**: Below minimum (0.1 SOL)
- **MaxSubmissionsReached**: Payment limit exceeded

### API Error Responses

- `400 Bad Request`: Invalid parameters or state
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server/blockchain error

## Security Considerations

1. **PDA Ownership**: Escrow PDAs are derived from owner's public key, ensuring only the owner can control funds
2. **Transaction Verification**: All transactions are verified on-chain before updating database
3. **Permission Checks**: API routes verify user has proper company permissions
4. **Double-payment Prevention**: Checks prevent processing payment twice for same submission
5. **Balance Verification**: Ensures escrow has sufficient balance before payment

## Environment Variables

Required environment variables:

```env
# Solana Configuration
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=e42d89fc-e7b5-4048-9994-fe074264ca49
NEXT_PUBLIC_PROGRAM_ID=3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp
PLATFORM_WALLET=YOUR_PLATFORM_WALLET_ADDRESS

# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Testing Checklist

- [ ] Create escrow with valid amount
- [ ] Try creating escrow with amount below minimum
- [ ] Fund bounty and verify transaction
- [ ] Approve submission
- [ ] Process payment and verify hunter receives correct amount
- [ ] Verify platform fee is deducted correctly
- [ ] Try processing payment twice (should fail)
- [ ] Close bounty and verify remaining funds returned
- [ ] Verify escrow balance updates correctly
- [ ] Test with multiple submissions per bounty
- [ ] Test max submissions limit

## Frontend Integration Example

```typescript
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';

// Initialize program
const program = new Program(IDL, PROGRAM_ID, provider);

// Derive escrow PDA
const [escrowPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('bounty-escrow'), ownerPublicKey.toBuffer()],
  PROGRAM_ID
);

// Initialize escrow
await program.methods
  .initialize(new BN(escrowAmount))
  .accounts({
    vault: escrowPDA,
    owner: ownerPublicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Process payment
await program.methods
  .processPayment(
    bountyId,
    submissionId,
    customAmount,
    rewardPerSubmission,
    maxSubmissions,
    currentPaidSubmissions
  )
  .accounts({
    vault: escrowPDA,
    owner: ownerPublicKey,
    hunterWallet: hunterPublicKey,
    platformWallet: platformPublicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Close bounty
await program.methods
  .closeBounty(bountyId)
  .accounts({
    vault: escrowPDA,
    owner: ownerPublicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Events Emitted by Smart Contract

### PaymentProcessed
```rust
{
  bounty_id: String,
  submission_id: String,
  hunter_wallet: Pubkey,
  amount: u64,
  platform_fee: u64
}
```

### BountyClosed
```rust
{
  bounty_id: String,
  remaining_amount: u64
}
```

Listen to these events on the frontend to provide real-time updates to users.
