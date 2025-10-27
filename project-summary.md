# Vulnera - Blockchain Bug Bounty Platform

## Project Overview
Vulnera is a decentralized bug bounty platform built on Solana that connects security researchers (hunters) with companies offering rewards for vulnerability discoveries. It combines Web2 authentication with Web3 blockchain payments through escrow-based smart contracts.

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.3 (App Router, Turbopack)
- **Language**: TypeScript 5.9.2
- **UI**: Tailwind CSS 4, Shadcn UI, Radix UI, Framer Motion
- **Solana**: @solana/web3.js 1.98.4, wallet-adapter, gill SDK
- **State**: Zustand, Jotai, React Query
- **Forms**: React Hook Form, Zod validation
- **Notifications**: Sonner (toast library)

### Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: PostgreSQL (Neon) with Prisma ORM 6.16.2
- **Authentication**: NextAuth.js 4.24.11 (credentials + wallet)
- **File Upload**: UploadThing
- **Email**: Nodemailer

### Blockchain
- **Network**: Solana Devnet
- **Framework**: Anchor 0.31.1
- **Program ID**: `CZ6kuqEBvfdzM8h3rACEYazp771BFDXDMNgsoNSNvJ5Q`
- **Language**: Rust (Anchor framework)

## Smart Contract Architecture

### Escrow System
- **PDA Derivation**: `[b"bounty-escrow", owner.key()]`
- **Minimum Escrow**: 0.1 SOL (100M lamports)
- **Platform Fee**: 2% (200 basis points)

### Instructions
1. **initialize(escrow_amount)** - Create escrow with company funds
2. **process_payment(bounty_id, submission_id, amount, ...)** - Pay hunter (98%) + platform fee (2%)
3. **close_bounty(bounty_id)** - Return remaining funds to company
4. **deposit(amount)** - Add more funds to existing escrow ⚠️ *Not deployed yet*

### Account Structure
```rust
BountyEscrow {
  owner: Pubkey,        // Company wallet
  escrow_amount: u64    // Virtual balance tracked
}
```

## Database Schema (Key Models)

### Users
- Roles: `BOUNTY_HUNTER`, `COMPANY_ADMIN`, `ADMIN`
- Tracks: earnings, reputation (0-100), rank, wallet address
- Auth: email/password + optional wallet verification

### Companies
- One wallet per company (escrow owner)
- Stats: total funded, total paid, active bounties, reputation
- Verification status for trusted companies

### Bounties
- Types: UI, FUNCTIONALITY, PERFORMANCE, SECURITY (array)
- Status: ACTIVE, CLOSED, EXPIRED
- Stores: escrowAddress, txSignature for blockchain link
- Constraints: max submissions, reward amount, deadlines

### Submissions
- Status flow: PENDING → APPROVED/REJECTED/NEEDS_MORE_INFO/DUPLICATE/SPAM
- AI spam/duplicate detection (scores stored)
- Response deadline: auto-calculated from bounty settings
- Links to Payment when approved

### Payments
- Status: PENDING → PROCESSING → COMPLETED/FAILED
- Blockchain: txSignature, confirmations tracking
- Calculates: platform fee, net amount to hunter

## Application Flow

### 1. User Onboarding
```
Register → Email verification → Login → Role selection
                                        ↓
                    Hunter: Browse bounties
                    Company: Onboarding → Register wallet → Create company
```

### 2. Company Creates Bounty
```
Dashboard → Create Bounty → Fill details → Save (DB)
                                          ↓
Fund Bounty → Frontend calls smart contract initialize()
            → Backend verifies txSignature → Updates bounty.escrowAddress
```

### 3. Hunter Submits Vulnerability
```
Browse Bounties → View Details → Submit Report
                                ↓
AI Analysis (spam/duplicate detection) → Status: PENDING
                                        ↓
Company reviews → APPROVED → Initiate Payment
```

### 4. Payment Processing
```
Company approves → API: /api/blockchain/release-payment
                  → Returns payment parameters
                  ↓
Frontend → Calls process_payment() on smart contract
         → Hunter receives 98%, platform gets 2%
         ↓
API: /api/blockchain/verify-transaction
   → Confirms payment → Updates DB → Notifies hunter
```

## Key Features Implemented

### Authentication
- ✅ Email/password with bcrypt hashing
- ✅ Email verification via OTP
- ✅ Wallet signature verification (Solana)
- ✅ Role-based access control
- ✅ Session management with NextAuth

### Security
- ✅ Rate limiting (100 req/min per IP)
- ✅ File upload validation (size, type)
- ✅ SQL injection protection (Prisma)
- ✅ XSS prevention (input sanitization)
- ✅ Wallet ownership verification

### Bounty Management
- ✅ Create/edit/close bounties
- ✅ Multi-type bounty support
- ✅ Scope definition (in/out of scope)
- ✅ Status lifecycle management
- ✅ Search and filtering

### Submission System
- ✅ File attachments (proof of concept)
- ✅ AI spam detection (scoring)
- ✅ Duplicate detection
- ✅ Response deadline tracking
- ✅ Comment system (public + internal)

### Blockchain Integration
- ✅ Escrow creation (initialize)
- ✅ Payment processing (process_payment)
- ✅ Bounty closure (close_bounty)
- ✅ Transaction verification
- ✅ Balance tracking
- ⚠️ Deposit feature (code exists, not deployed)

### Admin Panel
- ✅ User management (suspend/ban)
- ✅ Company verification
- ✅ Report moderation
- ✅ Platform statistics
- ✅ Audit logs

## API Routes (50+ endpoints)

### Auth
- `/api/auth/login`, `/api/auth/register`, `/api/auth/verify-otp`
- `/api/auth/forgot-password`, `/api/auth/reset-password`

### Bounties
- `/api/bounties` (GET, POST)
- `/api/bounties/[id]` (GET, PATCH, DELETE)
- `/api/bounties/[id]/fund`, `/api/bounties/[id]/close`
- `/api/bounties/[id]/submissions`, `/api/bounties/[id]/stats`

### Submissions
- `/api/submissions` (GET, POST)
- `/api/submissions/[id]/approve`, `/api/submissions/[id]/reject`
- `/api/submissions/[id]/ai-analyze`, `/api/submissions/[id]/comments`

### Blockchain
- `/api/blockchain/create-escrow`, `/api/blockchain/verify-wallet`
- `/api/blockchain/release-payment`, `/api/blockchain/verify-transaction`
- `/api/blockchain/prepare-deposit`, `/api/blockchain/deposit`
- `/api/blockchain/withdraw-escrow`, `/api/blockchain/register-company`

### Companies, Users, Payments, Reports, Notifications, Stats...

## Pages Structure

### Public
- `/` - Landing page with hero, features
- `/bounties` - Browse all active bounties
- `/bounties/[id]` - Bounty details
- `/leaderboard` - Top hunters by earnings
- `/companies/[id]/bounties` - Public company profile

### Hunter Dashboard
- `/dashboard/hunter` - Overview, recent submissions, earnings
- `/submissions` - All user submissions list
- `/submissions/[id]` - Submission details
- `/bounties/[id]/submit` - Submit vulnerability form

### Company Dashboard
- `/dashboard/company` - Stats, active bounties, submissions
- `/dashboard/company/bounties` - Manage bounties
- `/dashboard/company/bounties/create` - Create new bounty
- `/dashboard/company/submissions` - Review submissions
- `/dashboard/company/submissions/[id]` - Review details
- `/dashboard/company/settings` - Company settings

### Admin
- `/admin` - Platform overview
- `/admin/users`, `/admin/companies`, `/admin/reports`

### Account
- `/profile/[userId]` - Public user profile
- `/settings` - User settings
- `/onboarding/company` - Company registration flow

## Critical Issues & Gaps

### 1. Smart Contract Deployment ⚠️
**Problem**: The `deposit()` instruction exists in Rust code but is NOT in the deployed program's IDL.
**Impact**: "Add Funds" feature fails with `WalletSendTransactionError`
**Fix**: Run `anchor build && anchor deploy`, update `NEXT_PUBLIC_PROGRAM_ID`

### 2. Hydration Mismatch ⚠️
**Problem**: Server/client mismatch in theme toggle (Sun/Moon icon)
**Cause**: `next-themes` rendering before hydration
**Fix**: Wrap ThemeToggle in Suspense or use `suppressHydrationWarning`

### 3. AI Analysis Not Implemented
**Problem**: AI spam/duplicate detection endpoints exist but contain placeholder logic
**File**: `/api/submissions/[id]/ai-analyze`
**Impact**: All submissions pass AI checks (scores null)
**Fix**: Integrate ML model or external API (OpenAI, Anthropic)

### 4. Email Service
**Problem**: Using Gmail SMTP (not production-ready)
**Fix**: Switch to Resend, SendGrid, or AWS SES

### 5. Rate Limiting
**Problem**: In-memory Map (resets on server restart)
**Fix**: Use Redis (Upstash) for distributed rate limiting

### 6. File Storage
**Problem**: UploadThing used but config may need review
**Check**: File size limits, allowed types, cleanup strategy

## Development Commands
```bash
npm run dev              # Start Next.js (Turbopack)
npm run build            # Production build
npm run anchor-build     # Build smart contract
npm run anchor-deploy    # Deploy to devnet
npm run setup            # Sync program ID across codebase
npm run db:seed          # Seed database
```
