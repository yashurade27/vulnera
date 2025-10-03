# Testing & Validation Guide

This document explains how to validate the Vulnera platform end to end: standing up the stack, deploying the Anchor program, exercising API routes, and walking through role-based user journeys.

## 1. Goals & Scope
- Confirm the smart contract deploys correctly to a local validator or Devnet and exposes the PDA escrow flow.
- Validate that API routes and background jobs remain in sync with on-chain state.
- Exercise web UI / API flows for the three core personas: bounty hunter, company admin, and platform admin.
- Capture a repeatable checklist so regressions can be caught quickly before releases.

## 2. Prerequisites
- **Tooling**: Node.js 20+, npm 10+, Git, PostgreSQL 15+ (local or cloud), Rust 1.79+, Anchor CLI 0.31.x, Solana CLI 1.18+, pnpm/tsx (bundled via dev deps).
- **Secrets**: Mail provider credentials (Resend), Solana wallet keypairs for company admin and platform wallet, NextAuth secret.
- **Environment files**: Duplicate `.env.example` to `.env.local` and populate values described below. The front-end reads `NEXT_PUBLIC_*` variables at build time.

## 3. Environment Variables
Populate `./.env.local` (web) and `./anchor/Anchor.toml` (program) with:

```env
# Web / API
NEXTAUTH_SECRET=replace-me
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vulnera
SOLANA_RPC_URL=http://127.0.0.1:8899           # switch to devnet URL when testing there
NEXT_PUBLIC_PROGRAM_ID=3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp
PLATFORM_WALLET=<platform-wallet-public-key>
UPLOADTHING_SECRET=...
RESEND_API_KEY=...

# Anchor (Anchor.toml example)
[provider]
cluster = "localnet"         # change to "devnet" when deploying there
wallet = "~/.config/solana/id.json"

[programs.localnet]
vulnera_bounty = "3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp"
```

> When you redeploy the program the program ID changes. Re-run `npm run setup` to auto-synchronize the `declare_id!`, generated TypeScript exports, and `.env` values.

## 4. Local Stack Bring-Up
1. **Install dependencies**
   ```powershell
   npm install
   npm run setup
   ```
2. **Database**
   ```powershell
   npx prisma migrate dev --name init-local
   npm run db:seed
   ```
3. **Start services (three terminals)**
   - Anchor local validator and program deploy:
     ```powershell
     npm run anchor-localnet
     ```
   - Next.js API/UI:
     ```powershell
     npm run dev
     ```
   - Optional: Prisma Studio for DB inspection:
     ```powershell
     npx prisma studio
     ```
4. **Verify**
   - Hit `http://localhost:3000/api/health` ➝ expect `{ "status": "ok" }`.
   - `solana balance` should show airdropped SOL from anchor localnet for the configured wallet.

## 5. Deploying the Smart Contract

### 5.1 Local Validator (primary for automated testing)
1. `solana-test-validator` is launched automatically by `npm run anchor-localnet`.
2. In a separate shell, redeploy the program if you modified Rust code:
   ```powershell
   npm run anchor-build
   npm run anchor-test      # runs TypeScript integration tests against localnet
   ```
3. `npm run setup` syncs the new program ID to the front-end exports.

### 5.2 Devnet Deployment (manual QA / staging)
1. Configure Solana CLI:
   ```powershell
   solana config set --url https://api.devnet.solana.com
   solana-keygen new --outfile ~/.config/solana/devnet.json --force
   solana config set --keypair ~/.config/solana/devnet.json
   solana airdrop 2
   ```
2. Update `Anchor.toml` provider section to use `cluster = "devnet"` and the new keypair.
3. Build & deploy:
   ```powershell
   npm run anchor-build
   npm run anchor deploy -- --provider.cluster devnet
   ```
4. Run `npm run setup` again so `NEXT_PUBLIC_PROGRAM_ID` and generated clients reference the new ID.
5. Switch the web env to `SOLANA_RPC_URL=https://api.devnet.solana.com` and restart the Next.js server.
6. Confirm the program on Solana Explorer: https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet.

## 6. Layered Test Strategy

### 6.1 Static & Unit Checks
- `npm run lint` ➝ ESLint on the Next.js project.
- `npm run codama:js` ➝ regenerate client bindings after contract updates.
- `npm run anchor-test` ➝ exercises the smart contract instructions (initialize, process payment, close bounty) and failure cases.

### 6.2 API Integration Tests
- Run the scripted checklist:
  ```powershell
  npx tsx scripts\test-submissions-api.ts
  ```
  Populate the cookies/JWT values in the script output, then paste the generated cURL commands into PowerShell or any REST client.
- Key endpoints to cover:
  - `/api/auth/*` (register, login, OTP verification).
  - `/api/companies/*` (create company, invite members, fetch stats).
  - `/api/bounties/*` (CRUD, fund, close, stats).
  - `/api/submissions/*` (create, review, approve, reject, AI analyze).
  - `/api/payments/*` (confirm blockchain payment, verify status).
  - `/api/blockchain/*` (create-escrow, release-payment, withdraw-escrow).

### 6.3 Role-Based End-to-End Flows
Each flow assumes seed data; otherwise create accounts through the auth routes.

**Bounty Hunter**
- Register via `/auth/register` ➝ ensure email verification and OTP flow works.
- Browse `/bounties` ➝ verify active bounties filter and leaderboard integration.
- Submit report `/bounties/[id]/submit` ➝ check attachments upload to UploadThing and submission status `PENDING`.
- Receive notifications when company requests more info or approves payment.

**Company Admin**
- Login with seeded `sarah.ceo@techcorp.com` or create a new company via `/onboarding/company`.
- Create bounty (`/dashboard/company/bounties`) ➝ ensure `rewardAmount`, `maxSubmissions`, and scope fields persist.
- Funding workflow:
  1. Call `/api/blockchain/create-escrow` with lamports amount.
  2. Use wallet to invoke `initialize` (via generated JS SDK or Anchor CLI).
  3. POST to `/api/bounties/{id}/fund` with tx signature.
  4. Confirm bounty status becomes `ACTIVE` and escrow amount stored.
- Review submissions:
  - `/api/submissions/{id}/approve` with reward.
  - `/api/blockchain/release-payment` ➝ call `process_payment` on-chain.
  - `/api/payments/confirm` ➝ validate payment row created and hunter stats updated.
- Close bounty after payouts ➝ `/api/blockchain/withdraw-escrow` ➝ contract `close_bounty` ➝ `/api/bounties/{id}/close`.

**Platform Admin**
- Use seeded `admin@vulnera.com` (if present) or promote a user via Prisma Studio.
- Validate `/dashboard/admin` metrics match Prisma queries.
- Audit logs: trigger actions (user suspension, bounty closure) ➝ view `/api/admin/audit-logs`.
- Reports moderation: `/api/admin/reports` ➝ open investigation, resolve, dismiss.

### 6.4 Blockchain Consistency Checks
- **Escrow balance**: `solana account <escrowPDA>` ➝ confirm lamports match expected after funding, payments, withdraw.
- **Events**: While running payments, tail logs with `solana logs -u localhost` (or devnet) ➝ expect `PaymentProcessed` and `BountyClosed` events.
- **Client sync**: Generated SDK in `anchor/src/client/js/generated` should be refreshed (`npm run codama:js`) whenever IDL changes.

### 6.5 Regression Checklist
- [ ] OTP login + password reset flows (`/api/auth/*`).
- [ ] UploadThing attachments render correctly in submission details.
- [ ] Notifications badge reflects unread count (`/api/notifications/unread-count`).
- [ ] Prisma metrics (Company totals, Platform stats) align with manual calculations.
- [ ] Background cron jobs (if configured) do not break on missing blockchain data.
- [ ] All protected routes reject unauthorized roles (spot-check with hunter token hitting admin endpoints).

## 7. Starting Points & Tips
- **When unsure where to start**, run `npm run anchor-test` and `npm run db:seed`—they populate working data and validate foundation pieces.
- Move through flows in this order: (1) Authentication, (2) Company onboarding, (3) Bounty lifecycle, (4) Payment lifecycle, (5) Bounty closure. Each step depends on the previous one.
- Keep the Solana Explorer open (localnet UI via `solana logs` / `solana account`, devnet via web) to correlate API responses with on-chain state.

## 8. Useful Commands (PowerShell)
```powershell
# Rebuild contract + regenerate TS exports
npm run anchor-build; npm run codama:js

# Reset database
npx prisma migrate reset --force --skip-generate --skip-seed
npm run db:seed

# Check escrow PDA account
solana account <PDA_PUBLIC_KEY>

# Confirm transaction on devnet
solana confirm <TX_SIGNATURE>
```

## 9. Next Steps
- Automate the manual API checklist with Vitest or Playwright once flows stabilize.
- Wire blockchain transaction signing directly into the web app using the generated Anchor client so QA can exercise the flows entirely from the UI.
- Integrate CI jobs (`npm run ci`, `npm run anchor-test`) in GitHub Actions for every PR.
