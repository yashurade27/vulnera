-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('BOUNTY_HUNTER', 'COMPANY_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."BountyStatus" AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."BountyType" AS ENUM ('UI', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'SPAM', 'NEEDS_MORE_INFO');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('LATE_RESPONSE', 'UNFAIR_REJECTION', 'SPAM_SUBMISSION', 'INAPPROPRIATE_CONTENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'BOUNTY_HUNTER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "walletAddress" TEXT,
    "fullName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "country" TEXT,
    "totalEarnings" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "totalBounties" INTEGER NOT NULL DEFAULT 0,
    "reputation" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "rank" INTEGER,
    "githubUrl" TEXT,
    "twitterUrl" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "walletAddress" TEXT NOT NULL,
    "smartContractAddress" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "location" TEXT,
    "totalBountiesFunded" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "totalBountiesPaid" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "activeBounties" INTEGER NOT NULL DEFAULT 0,
    "resolvedVulnerabilities" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanyMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'COMPANY_ADMIN',
    "canCreateBounty" BOOLEAN NOT NULL DEFAULT false,
    "canReviewBounty" BOOLEAN NOT NULL DEFAULT false,
    "canApprovePayment" BOOLEAN NOT NULL DEFAULT false,
    "canManageMembers" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bounty" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bountyType" "public"."BountyType" NOT NULL,
    "targetUrl" TEXT,
    "rewardAmount" DECIMAL(20,9) NOT NULL,
    "maxSubmissions" INTEGER,
    "status" "public"."BountyStatus" NOT NULL DEFAULT 'ACTIVE',
    "escrowAddress" TEXT,
    "txSignature" TEXT,
    "inScope" TEXT[],
    "outOfScope" TEXT[],
    "requirements" TEXT NOT NULL,
    "guidelines" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "responseDeadline" INTEGER NOT NULL DEFAULT 21,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "validSubmissions" INTEGER NOT NULL DEFAULT 0,
    "paidOut" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Bounty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bountyType" "public"."BountyType" NOT NULL,
    "vulnerabilityType" TEXT NOT NULL,
    "stepsToReproduce" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "proofOfConcept" TEXT,
    "attachments" TEXT[],
    "aiSpamScore" DOUBLE PRECISION,
    "aiDuplicateScore" DOUBLE PRECISION,
    "aiAnalysisResult" JSONB,
    "isAiFiltered" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseDeadline" TIMESTAMP(3) NOT NULL,
    "rewardAmount" DECIMAL(20,9),
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(20,9) NOT NULL,
    "platformFee" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(20,9) NOT NULL,
    "txSignature" TEXT NOT NULL,
    "fromWallet" TEXT NOT NULL,
    "toWallet" TEXT NOT NULL,
    "blockchainConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "submissionId" TEXT,
    "reportedUserId" TEXT,
    "reportedCompanyId" TEXT,
    "type" "public"."ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT[],
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformStats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "totalCompanies" INTEGER NOT NULL DEFAULT 0,
    "newCompanies" INTEGER NOT NULL DEFAULT 0,
    "activeCompanies" INTEGER NOT NULL DEFAULT 0,
    "totalBounties" INTEGER NOT NULL DEFAULT 0,
    "activeBounties" INTEGER NOT NULL DEFAULT 0,
    "newBounties" INTEGER NOT NULL DEFAULT 0,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "newSubmissions" INTEGER NOT NULL DEFAULT 0,
    "approvedSubmissions" INTEGER NOT NULL DEFAULT 0,
    "rejectedSubmissions" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "platformFees" DECIMAL(20,9) NOT NULL DEFAULT 0,
    "paymentsMade" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "public"."User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "public"."User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "public"."Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_walletAddress_key" ON "public"."Company"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Company_smartContractAddress_key" ON "public"."Company"("smartContractAddress");

-- CreateIndex
CREATE INDEX "Company_slug_idx" ON "public"."Company"("slug");

-- CreateIndex
CREATE INDEX "Company_walletAddress_idx" ON "public"."Company"("walletAddress");

-- CreateIndex
CREATE INDEX "Company_isVerified_isActive_idx" ON "public"."Company"("isVerified", "isActive");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_isActive_idx" ON "public"."CompanyMember"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_userId_companyId_key" ON "public"."CompanyMember"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Bounty_escrowAddress_key" ON "public"."Bounty"("escrowAddress");

-- CreateIndex
CREATE INDEX "Bounty_companyId_status_idx" ON "public"."Bounty"("companyId", "status");

-- CreateIndex
CREATE INDEX "Bounty_status_bountyType_idx" ON "public"."Bounty"("status", "bountyType");

-- CreateIndex
CREATE INDEX "Bounty_startsAt_endsAt_idx" ON "public"."Bounty"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_paymentId_key" ON "public"."Submission"("paymentId");

-- CreateIndex
CREATE INDEX "Submission_bountyId_status_idx" ON "public"."Submission"("bountyId", "status");

-- CreateIndex
CREATE INDEX "Submission_userId_status_idx" ON "public"."Submission"("userId", "status");

-- CreateIndex
CREATE INDEX "Submission_companyId_status_idx" ON "public"."Submission"("companyId", "status");

-- CreateIndex
CREATE INDEX "Submission_status_responseDeadline_idx" ON "public"."Submission"("status", "responseDeadline");

-- CreateIndex
CREATE INDEX "Submission_submittedAt_idx" ON "public"."Submission"("submittedAt");

-- CreateIndex
CREATE INDEX "Comment_submissionId_createdAt_idx" ON "public"."Comment"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "public"."Comment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_submissionId_key" ON "public"."Payment"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_txSignature_key" ON "public"."Payment"("txSignature");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "public"."Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_companyId_status_idx" ON "public"."Payment"("companyId", "status");

-- CreateIndex
CREATE INDEX "Payment_txSignature_idx" ON "public"."Payment"("txSignature");

-- CreateIndex
CREATE INDEX "Payment_status_initiatedAt_idx" ON "public"."Payment"("status", "initiatedAt");

-- CreateIndex
CREATE INDEX "Report_reporterId_status_idx" ON "public"."Report"("reporterId", "status");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "public"."Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_submissionId_idx" ON "public"."Report"("submissionId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "public"."Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "public"."AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformStats_date_key" ON "public"."PlatformStats"("date");

-- CreateIndex
CREATE INDEX "PlatformStats_date_idx" ON "public"."PlatformStats"("date");

-- AddForeignKey
ALTER TABLE "public"."CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bounty" ADD CONSTRAINT "Bounty_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "public"."Bounty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reportedCompanyId_fkey" FOREIGN KEY ("reportedCompanyId") REFERENCES "public"."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
