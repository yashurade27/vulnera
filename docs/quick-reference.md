# Quick Reference: Smart Contract API Integration

## Endpoints Overview

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/blockchain/create-escrow` | POST | Get PDA address for escrow | No |
| `/api/blockchain/release-payment` | POST | Get payment parameters | Yes (Company Admin) |
| `/api/blockchain/withdraw-escrow` | POST | Get withdrawal parameters | Yes (Company Admin) |
| `/api/bounties/{id}/fund` | POST | Confirm escrow funding | Yes (Company Admin) |
| `/api/bounties/{id}/close` | POST | Close bounty | Yes (Company Admin) |
| `/api/submissions/{id}/approve` | POST | Approve submission | Yes (Company Admin) |
| `/api/payments/confirm` | POST | Confirm payment transaction | Yes (Company Admin) |
| `/api/auth/session` | GET | Get current session data | No |
| `/api/companies/my-company` | GET | Fetch current user's company | Yes |
| `/api/bounties/{id}/status` | PATCH | Update bounty status (DRAFT, ACTIVE, CLOSED, EXPIRED) | Yes |

## Smart Contract Functions

### initialize
```rust
pub fn initialize(ctx: Context<Initialize>, escrow_amount: u64) -> Result<()>
```
**Accounts:**
- `vault` - PDA escrow account (init)
- `owner` - Company wallet (signer, mut)
- `system_program` - System program

**Seeds:** `[b"bounty-escrow", owner.key()]`

### process_payment
```rust
pub fn process_payment(
    ctx: Context<ProcessPayment>,
    bounty_id: String,
    submission_id: String,
    custom_amount: Option<u64>,
    reward_per_submission: u64,
    max_submissions: u32,
    current_paid_submissions: u32,
) -> Result<()>
```
**Accounts:**
- `vault` - PDA escrow account (mut)
- `owner` - Company wallet (signer, mut)
- `hunter_wallet` - Bounty hunter wallet (mut)
- `platform_wallet` - Platform wallet (mut)
- `system_program` - System program

### close_bounty
```rust
pub fn close_bounty(ctx: Context<CloseBounty>, bounty_id: String) -> Result<()>
```
**Accounts:**
- `vault` - PDA escrow account (mut)
- `owner` - Company wallet (signer, mut)
- `system_program` - System program

## API Request/Response Examples

### 1. Create Escrow
```bash
POST /api/blockchain/create-escrow
Content-Type: application/json

{
  "ownerWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "amount": 100000000
}
```
```json
{
  "success": true,
  "escrowAddress": "8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR",
  "expectedAmount": 100000000,
  "message": "Escrow address derived. Please sign and send the initialize transaction from your wallet."
}
```

### 2. Release Payment
```bash
POST /api/blockchain/release-payment
Content-Type: application/json
Authorization: Bearer <token>

{
  "submissionId": "clx1234567890",
  "customAmount": null
}
```
```json
{
  "success": true,
  "paymentParams": {
    "programId": "3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp",
    "bountyId": "clx0987654321",
    "submissionId": "clx1234567890",
    "escrowAddress": "8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR",
    "ownerWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "hunterWallet": "FWQvw7FpFZvxGZYpKGmZdZz3wUn9fJhpFzxhQQP6iY5P",
    "platformWallet": "GbLLTkUjCznwRrkLM6tewimmW6ZCC4AP8eF9yAD8e5qT",
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

### 3. Confirm Payment
```bash
POST /api/payments/confirm
Content-Type: application/json
Authorization: Bearer <token>

{
  "submissionId": "clx1234567890",
  "txSignature": "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnTP..."
}
```
```json
{
  "success": true,
  "payment": {
    "id": "clx9876543210",
    "submissionId": "clx1234567890",
    "amount": 0.5,
    "platformFee": 0.01,
    "netAmount": 0.49,
    "txSignature": "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnTP...",
    "status": "COMPLETED"
  },
  "message": "Payment confirmed successfully"
}
```

### 4. Withdraw Escrow
```bash
POST /api/blockchain/withdraw-escrow
Content-Type: application/json
Authorization: Bearer <token>

{
  "bountyId": "clx0987654321"
}
```
```json
{
  "success": true,
  "withdrawParams": {
    "programId": "3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp",
    "bountyId": "clx0987654321",
    "escrowAddress": "8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR",
    "ownerWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "remainingAmount": 300000000
  }
}
```

## Constants

```typescript
// Program ID
PROGRAM_ID = "3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp"

// Minimum escrow amount
MIN_ESCROW_AMOUNT = 100_000_000 // 0.1 SOL

// Platform fee
PLATFORM_FEE_BPS = 200 // 2%

// Lamports per SOL
LAMPORTS_PER_SOL = 1_000_000_000
```

## Helper Functions

```typescript
// Derive escrow PDA
const [escrowPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from('bounty-escrow'), ownerPublicKey.toBuffer()],
  PROGRAM_ID
)

// Convert SOL to lamports
const lamports = Math.floor(sol * 1_000_000_000)

// Convert lamports to SOL
const sol = lamports / 1_000_000_000

// Calculate platform fee
const platformFee = Math.floor((amount * 200) / 10000)

// Calculate net amount
const netAmount = amount - platformFee
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `InsufficientFunds` | Escrow balance too low | Fund escrow with more SOL |
| `InvalidEscrowAmount` | Amount < 0.1 SOL | Increase escrow amount |
| `MaxSubmissionsReached` | Payment limit exceeded | Close bounty or increase limit |
| `Unauthorized` | No auth token | Login and provide token |
| `Insufficient permissions` | Not company admin | Check user role and company membership |
| `Transaction not confirmed` | TX not on-chain | Wait for confirmation or resend |
| `Escrow owner does not match` | Wrong company wallet | Use correct company wallet |

## Workflow Checklist

### Creating a Bounty
- [ ] Create bounty in database
- [ ] Get escrow PDA address
- [ ] Sign initialize transaction from company wallet
- [ ] Confirm funding with transaction signature
- [ ] Verify bounty status is funded

### Paying a Submission
- [ ] Approve submission in database
- [ ] Get payment parameters
- [ ] Sign process_payment transaction from company wallet
- [ ] Confirm payment with transaction signature
- [ ] Verify payment record created

### Closing a Bounty
- [ ] Ensure no pending submissions
- [ ] Close bounty in database
- [ ] Get withdrawal parameters
- [ ] Sign close_bounty transaction from company wallet
- [ ] Verify escrow balance returned

## Security Checklist

- [ ] Always verify transactions on-chain before updating database
- [ ] Check user has proper permissions before allowing operations
- [ ] Validate escrow ownership matches company wallet
- [ ] Prevent double-payment by checking existing payment records
- [ ] Verify escrow has sufficient balance before payment
- [ ] Log all critical operations for audit trail
- [ ] Use environment variables for sensitive data (wallets, keys)
- [ ] Validate all input parameters (wallet addresses, amounts, signatures)

## Links

- [Full Integration Guide](./smart-contract-integration.md)
- [API Changes Summary](./api-changes-summary.md)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Anchor Docs](https://www.anchor-lang.com/)
