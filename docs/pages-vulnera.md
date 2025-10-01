# Vulnera Platform - Essential Pages (Hackathon MVP)

## 🎯 Core Pages (Must Have) - 10 Pages

### 1. **Landing Page** `/`
**Purpose**: First impression, explain platform value proposition

**Sections**:
- Hero section with CTA (Get Started / Browse Bounties)
- How it works (3 steps: Create/Fund → Submit → Get Paid)
- Key features (Blockchain transparency, AI filtering, 2% fee)
- Stats showcase (Total bounties, Total paid, Active hunters)
- Featured bounties preview
- Footer with links

**APIs Used**:
- `GET /api/stats/platform` - Platform statistics
- `GET /api/bounties?limit=6` - Featured bounties

---

### 2. **Authentication Pages**

#### `/auth/login`
- Email/password login
- Connect wallet option
- Link to register

**APIs**: `POST /api/auth/login`, `POST /api/auth/verify-wallet`

#### `/auth/register`
- Choose role: Bounty Hunter or Company Admin
- Email, username, password fields
- Optional wallet connection
- Terms acceptance

**APIs**: `POST /api/auth/register`

---

### 3. **Browse Bounties** `/bounties`
**Purpose**: Public listing of all active bounties

**Features**:
- Filter by type (UI/Functionality/Performance/Security)
- Filter by reward range
- Search by keyword
- Sort by: newest, highest reward, ending soon
- Bounty cards showing: title, company, type, reward, deadline

**APIs Used**:
- `GET /api/bounties` with filters
- `GET /api/companies` for company details

---

### 4. **Bounty Details** `/bounties/[bountyId]`
**Purpose**: Complete bounty information and submission

**Sections**:
- Bounty header (title, company, reward, type)
- Description and requirements
- Scope (in-scope, out-of-scope)
- Guidelines
- Stats (total submissions, paid submissions)
- Submit bug button (for hunters)
- Submissions list (for company members)

**APIs Used**:
- `GET /api/bounties/[bountyId]`
- `GET /api/bounties/[bountyId]/submissions`
- `POST /api/submissions` (when submitting)

---

### 5. **Submit Bug Report** `/bounties/[bountyId]/submit`
**Purpose**: Bug submission form for hunters

**Form Fields**:
- Title
- Bounty type selection
- Vulnerability type
- Description (rich text editor)
- Steps to reproduce
- Impact assessment
- Proof of concept (optional)
- File attachments (screenshots, videos)

**APIs Used**:
- `POST /api/submissions`
- `POST /api/upload/attachment`

---

### 6. **Company Dashboard** `/dashboard/company`
**Purpose**: Central hub for companies to manage bounties

**Sections**:
- Overview stats (active bounties, pending submissions, total paid)
- Active bounties list
- Recent submissions (pending review)
- Quick actions (Create bounty, View reports)

**APIs Used**:
- `GET /api/companies/[companyId]/stats`
- `GET /api/companies/[companyId]/bounties`
- `GET /api/submissions?companyId=[id]&status=PENDING`

---

### 7. **Hunter Dashboard** `/dashboard/hunter`
**Purpose**: Central hub for bounty hunters

**Sections**:
- Profile stats (total earnings, reputation, rank)
- Recent submissions with status
- Available bounties (recommendations)
- Payment history

**APIs Used**:
- `GET /api/users/[userId]/stats`
- `GET /api/users/[userId]/submissions`
- `GET /api/bounties?limit=6`
- `GET /api/payments/user/[userId]`

---

### 8. **Create Bounty** `/dashboard/company/bounties/create`
**Purpose**: Company creates and funds new bounty

**Steps/Form**:
1. Basic Info (title, description, type)
2. Target details (URL, scope)
3. Requirements and guidelines
4. Reward configuration (amount per submission, max submissions)
5. Duration (start/end dates)
6. Fund via wallet (connect to Solana smart contract)

**APIs Used**:
- `POST /api/bounties`
- `POST /api/blockchain/create-escrow`
- `POST /api/bounties/[bountyId]/fund`

---

### 9. **Submission Review** `/dashboard/company/submissions/[submissionId]`
**Purpose**: Company reviews and approves/rejects submissions

**Sections**:
- Submission details (full bug report)
- AI analysis results (spam score, duplicate score)
- Comments/discussion thread
- Review actions:
  - Approve & Pay (triggers smart contract)
  - Reject with reason
  - Request more info
- Transaction history

**APIs Used**:
- `GET /api/submissions/[submissionId]`
- `POST /api/submissions/[submissionId]/approve`
- `POST /api/submissions/[submissionId]/reject`
- `POST /api/blockchain/release-payment`
- `POST /api/submissions/[submissionId]/comments`

---

### 10. **User Profile** `/profile/[userId]`
**Purpose**: Public profile for bounty hunters and companies

**For Hunters**:
- Profile info (avatar, bio, social links)
- Stats (total earned, bounties completed, reputation)
- Recent successful submissions (public)
- Badges/achievements

**For Companies**:
- Company info (logo, description, website)
- Stats (total bounties, total paid, active bounties)
- Active bounties list

**APIs Used**:
- `GET /api/users/[userId]`
- `GET /api/users/[userId]/stats`
- `GET /api/companies/[companyId]`

---

## 🎨 Optional But Recommended (Nice to Have) - 4 Pages

### 11. **Leaderboard** `/leaderboard`
**Purpose**: Showcase top bounty hunters

**Features**:
- Top 50 hunters by earnings
- Filter by timeframe (all-time, monthly, weekly)
- Hunter cards with stats

**APIs**: `GET /api/users/leaderboard`

---

### 12. **Company Profile Setup** `/onboarding/company`
**Purpose**: First-time setup for companies

**Form**:
- Company name, description
- Logo upload
- Website, industry
- Wallet connection
- Register on smart contract

**APIs**: `POST /api/companies`, `POST /api/blockchain/register-company`

---

### 13. **Notifications** `/notifications`
**Purpose**: View all notifications

**Features**:
- List of all notifications
- Filter by type
- Mark as read/unread
- Quick actions from notifications

**APIs**: `GET /api/notifications`, `PATCH /api/notifications/[id]`

---

### 14. **Settings** `/settings`
**Purpose**: User account settings

**Sections**:
- Profile settings (name, bio, avatar)
- Wallet management
- Email preferences
- Password change
- Social links

**APIs**: `PATCH /api/users/[userId]`, `PATCH /api/users/[userId]/wallet`

---

## 📱 Page Priority for Hackathon Demo

### Phase 1 - Core Demo Flow (Must Have)
1. ✅ Landing Page
2. ✅ Login/Register
3. ✅ Browse Bounties
4. ✅ Bounty Details
5. ✅ Submit Bug Report
6. ✅ Company Dashboard
7. ✅ Hunter Dashboard
8. ✅ Create Bounty (with wallet integration)
9. ✅ Submission Review (with payment flow)

**This gives you the complete user journey:**
- User discovers platform → registers → browses bounties → submits bug
- Company creates bounty → funds it → reviews submission → approves & pays
- Money flows through smart contract ✨

### Phase 2 - Polish (If Time Permits)
10. User Profile
11. Leaderboard
12. Notifications
13. Settings

---

## 🎬 Demo Script for Judges

### Act 1: Hunter Journey (2 min)
1. Start on landing page - show stats
2. Browse bounties with filters
3. Click on a bounty (Security type)
4. Submit a bug report with attachments
5. Dashboard shows pending submission

### Act 2: Company Journey (2 min)
1. Company login
2. Create new bounty
3. Connect wallet & fund bounty (show smart contract interaction)
4. Review pending submission
5. Approve submission (triggers smart contract payment)
6. Show blockchain transaction confirmation

### Act 3: Platform Features (1 min)
1. Show AI analysis results (spam/duplicate detection)
2. Show leaderboard with top hunters
3. Show transparency (all payments on-chain)
4. Show 21-day accountability feature

---

## 📐 Layout Components (Shared Across Pages)

### Global Components
1. **Navbar**
   - Logo
   - Browse Bounties
   - Dashboard (if logged in)
   - Notifications icon
   - Wallet connect button
   - User menu

2. **Footer**
   - Links (About, How it works, Terms, Privacy)
   - Social media
   - Platform stats

3. **Sidebar** (Dashboard pages)
   - For Companies: Overview, Bounties, Submissions, Reports, Settings
   - For Hunters: Overview, Submissions, Payments, Settings

---

## 🚀 Tech Stack for Pages

- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS + Shadcn/UI
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: Tiptap or Lexical editor
- **Charts**: Recharts (for dashboards)
- **Wallet**: Solana Wallet Adapter
- **State**: React Context or Zustand
- **File Upload**: UploadThing

---

## ✨ Key Features to Highlight

1. **Wallet Integration** - Show wallet connection and smart contract interactions
2. **Real-time Updates** - Submission status changes, payment confirmations
3. **AI Analysis** - Visual display of spam/duplicate scores
4. **Blockchain Transparency** - Link to Solana explorer for transactions
5. **Responsive Design** - Works on mobile and desktop
6. **Clean UX** - Intuitive flow from bounty creation to payment

---

## 🎯 Minimum Viable Demo (If Very Short on Time)

If you have very limited time, focus on these **5 critical pages**:

1. **Landing Page** - First impression
2. **Browse Bounties** - Core discovery
3. **Bounty Details + Submit** - Combined view
4. **Company Dashboard** - With review & approve
5. **Simple Profile/Stats** - Show the results

This covers the essential flow and demonstrates blockchain integration!

---

## Summary

**Core Pages: 10** (enough for full demo)
**Optional Pages: 4** (polish and extras)

**Total for MVP: 10-14 pages**
