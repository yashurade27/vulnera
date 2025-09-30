/**
 * VULNERA BUG BOUNTY PLATFORM - COMPLETE API ROUTES
 * Next.js App Router Structure (app directory)
 */

// ==================== AUTHENTICATION & USER MANAGEMENT ====================
<!-- 
/**
 * POST /api/auth/register
 * Register a new user (bounty hunter or company admin)
 * Body: { email, username, password, role, walletAddress? }
 */

/**
 * POST /api/auth/login
 * Login user with email/password
 * Body: { email, password }
 * Returns: { user, token }
 */

/**
 * POST /api/auth/logout
 * Logout current user
 */

/**
 * POST /api/auth/verify-wallet
 * Verify Solana wallet ownership
 * Body: { walletAddress, signature }
 */

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Body: { email }
 */

/**
 * POST /api/auth/reset-password
 * Reset password with token
 * Body: { token, newPassword }
 */

/**
 * GET /api/auth/me
 * Get current authenticated user
 */ -->

// ==================== USER PROFILE ====================
<!-- 
/**
 * GET /api/users/[userId]
 * Get user profile by ID
 */

/**
 * PATCH /api/users/[userId]
 * Update user profile
 * Body: { fullName?, bio?, avatarUrl?, country?, socialLinks? }
 */

/**
 * GET /api/users/[userId]/stats
 * Get user statistics (earnings, bounties, reputation)
 */

/**
 * GET /api/users/[userId]/submissions
 * Get user's submission history
 * Query: { status?, limit?, offset? }
 */

/**
 * GET /api/users/leaderboard
 * Get top bounty hunters leaderboard
 * Query: { limit?, timeframe? }
 */

/**
 * PATCH /api/users/[userId]/wallet
 * Update wallet address
 * Body: { walletAddress, signature }
 */ -->

// ==================== COMPANY MANAGEMENT ====================

/**
 * POST /api/companies
 * Create a new company
 * Body: { name, description, website, walletAddress, industry?, companySize? }
 */

/**
 * GET /api/companies
 * Get all companies (with pagination and filters)
 * Query: { search?, verified?, active?, limit?, offset? }
 */

/**
 * GET /api/companies/[companyId]
 * Get company details
 */

/**
 * PATCH /api/companies/[companyId]
 * Update company details
 * Body: { name?, description?, website?, logoUrl?, industry? }
 */

/**
 * DELETE /api/companies/[companyId]
 * Delete/deactivate company
 */

/**
 * GET /api/companies/[companyId]/stats
 * Get company statistics
 */

/**
 * GET /api/companies/[companyId]/bounties
 * Get all bounties for a company
 * Query: { status?, type?, limit?, offset? }
 */

// ==================== COMPANY MEMBERS ====================

/**
 * POST /api/companies/[companyId]/members
 * Invite/add a member to company
 * Body: { userId, role, permissions }
 */

/**
 * GET /api/companies/[companyId]/members
 * Get all company members
 */

/**
 * PATCH /api/companies/[companyId]/members/[memberId]
 * Update member role and permissions
 * Body: { role?, permissions? }
 */

/**
 * DELETE /api/companies/[companyId]/members/[memberId]
 * Remove member from company
 */

// ==================== BOUNTY MANAGEMENT ====================

/**
 * POST /api/bounties
 * Create a new bounty
 * Body: { companyId, title, description, bountyType, rewardAmount, targetUrl?,
 *         inScope[], outOfScope[], requirements, guidelines?, startsAt?, endsAt? }
 */

/**
 * GET /api/bounties
 * Get all bounties (public listing with filters)
 * Query: { type?, status?, companyId?, search?, minReward?, maxReward?, limit?, offset? }
 */

/**
 * GET /api/bounties/[bountyId]
 * Get bounty details
 */

/**
 * PATCH /api/bounties/[bountyId]
 * Update bounty details
 * Body: { title?, description?, status?, rewardAmount?, requirements? }
 */

/**
 * DELETE /api/bounties/[bountyId]
 * Delete/close bounty
 */

/**
 * POST /api/bounties/[bountyId]/fund
 * Fund bounty via smart contract
 * Body: { txSignature, escrowAddress }
 */

/**
 * POST /api/bounties/[bountyId]/close
 * Close bounty and withdraw remaining funds
 * Body: { txSignature }
 */

/**
 * GET /api/bounties/[bountyId]/submissions
 * Get all submissions for a bounty
 * Query: { status?, limit?, offset? }
 */

/**
 * GET /api/bounties/[bountyId]/stats
 * Get bounty statistics
 */

// ==================== SUBMISSION MANAGEMENT ====================

/**
 * POST /api/submissions
 * Submit a bug report
 * Body: { bountyId, title, description, bountyType, vulnerabilityType,
 *         stepsToReproduce, impact, proofOfConcept?, attachments[] }
 */

/**
 * GET /api/submissions
 * Get submissions (with filters)
 * Query: { bountyId?, userId?, companyId?, status?, limit?, offset? }
 */

/**
 * GET /api/submissions/[submissionId]
 * Get submission details
 */

/**
 * PATCH /api/submissions/[submissionId]
 * Update submission (only by author before review)
 * Body: { title?, description?, stepsToReproduce?, impact? }
 */

/**
 * DELETE /api/submissions/[submissionId]
 * Delete submission (only by author, only if pending)
 */

/**
 * POST /api/submissions/[submissionId]/review
 * Review a submission (company only)
 * Body: { status, reviewNotes?, rejectionReason?, rewardAmount? }
 */

/**
 * POST /api/submissions/[submissionId]/approve
 * Approve submission and trigger payment
 * Body: { rewardAmount }
 */

/**
 * POST /api/submissions/[submissionId]/reject
 * Reject submission with reason
 * Body: { rejectionReason }
 */

/**
 * POST /api/submissions/[submissionId]/request-info
 * Request more information from submitter
 * Body: { message }
 */

/**
 * POST /api/submissions/[submissionId]/ai-analyze
 * Trigger AI analysis for spam/duplicate detection
 * Returns: { aiSpamScore, aiDuplicateScore, aiAnalysisResult }
 */

// ==================== COMMENTS ====================

/**
 * POST /api/submissions/[submissionId]/comments
 * Add comment to submission
 * Body: { content, isInternal? }
 */

/**
 * GET /api/submissions/[submissionId]/comments
 * Get all comments for a submission
 * Query: { includeInternal? }
 */

/**
 * PATCH /api/comments/[commentId]
 * Update comment
 * Body: { content }
 */

/**
 * DELETE /api/comments/[commentId]
 * Delete comment
 */

// ==================== PAYMENT MANAGEMENT ====================

/**
 * POST /api/payments
 * Process payment for approved submission
 * Body: { submissionId, txSignature, amount }
 */

/**
 * GET /api/payments
 * Get payment history
 * Query: { userId?, companyId?, status?, limit?, offset? }
 */

/**
 * GET /api/payments/[paymentId]
 * Get payment details
 */

/**
 * POST /api/payments/[paymentId]/verify
 * Verify blockchain transaction
 * Returns: { confirmed, confirmations }
 */

/**
 * GET /api/payments/user/[userId]
 * Get user's payment history
 */

/**
 * GET /api/payments/company/[companyId]
 * Get company's payment history
 */

// ==================== REPORTS & ACCOUNTABILITY ====================

/**
 * POST /api/reports
 * Create a report (late response, unfair rejection, etc.)
 * Body: { type, submissionId?, reportedUserId?, reportedCompanyId?,
 *         title, description, evidence[] }
 */

/**
 * GET /api/reports
 * Get all reports (admin/filtered by user)
 * Query: { status?, type?, reporterId?, limit?, offset? }
 */

/**
 * GET /api/reports/[reportId]
 * Get report details
 */

/**
 * PATCH /api/reports/[reportId]
 * Update report status (admin only)
 * Body: { status, resolution?, actionTaken? }
 */

/**
 * POST /api/reports/[reportId]/resolve
 * Resolve a report (admin only)
 * Body: { resolution, actionTaken }
 */

/**
 * GET /api/reports/submission/[submissionId]
 * Get reports related to a submission
 */

// ==================== NOTIFICATIONS ====================

/**
 * GET /api/notifications
 * Get user notifications
 * Query: { isRead?, limit?, offset? }
 */

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */

/**
 * PATCH /api/notifications/[notificationId]
 * Mark notification as read
 */

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */

/**
 * DELETE /api/notifications/[notificationId]
 * Delete notification
 */

// ==================== BLOCKCHAIN INTEGRATION ====================

/**
 * POST /api/blockchain/verify-wallet
 * Verify wallet ownership via signature
 * Body: { walletAddress, signature, message }
 */

/**
 * POST /api/blockchain/create-escrow
 * Create escrow account for bounty
 * Body: { bountyId, amount }
 * Returns: { escrowAddress, txSignature }
 */

/**
 * POST /api/blockchain/release-payment
 * Release payment from escrow
 * Body: { submissionId, escrowAddress, recipientWallet, amount }
 * Returns: { txSignature }
 */

/**
 * POST /api/blockchain/withdraw-escrow
 * Withdraw remaining funds from closed bounty
 * Body: { bountyId, escrowAddress }
 * Returns: { txSignature, amount }
 */

/**
 * GET /api/blockchain/transaction/[signature]
 * Get transaction status and details
 */

/**
 * POST /api/blockchain/verify-transaction
 * Verify transaction on Solana
 * Body: { signature }
 * Returns: { confirmed, blockTime, status }
 */

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/users
 * Get all users with filters (admin only)
 * Query: { role?, status?, search?, limit?, offset? }
 */

/**
 * PATCH /api/admin/users/[userId]
 * Update user status (suspend, ban, activate)
 * Body: { status, reason? }
 */

/**
 * GET /api/admin/companies
 * Get all companies (admin only)
 * Query: { verified?, active?, limit?, offset? }
 */

/**
 * POST /api/admin/companies/[companyId]/verify
 * Verify a company (admin only)
 */

/**
 * GET /api/admin/reports
 * Get all reports (admin only)
 * Query: { status?, type?, limit?, offset? }
 */

/**
 * GET /api/admin/stats
 * Get platform-wide statistics
 */

/**
 * GET /api/admin/audit-logs
 * Get audit logs
 * Query: { userId?, entityType?, action?, startDate?, endDate?, limit?, offset? }
 */

// ==================== ANALYTICS & STATISTICS ====================

/**
 * GET /api/stats/platform
 * Get platform statistics
 * Query: { startDate?, endDate? }
 */

/**
 * GET /api/stats/daily
 * Get daily statistics
 * Query: { date?, days? }
 */

/**
 * GET /api/stats/bounty-types
 * Get statistics by bounty type
 */

/**
 * GET /api/stats/trending
 * Get trending bounties and top performers
 */

// ==================== SEARCH & DISCOVERY ====================

/**
 * GET /api/search
 * Global search across bounties, companies, users
 * Query: { q, type?, limit? }
 */

/**
 * GET /api/search/bounties
 * Advanced bounty search
 * Query: { q?, type?, minReward?, maxReward?, companyId?, status? }
 */

/**
 * GET /api/search/companies
 * Search companies
 * Query: { q?, industry?, verified? }
 */

// ==================== FILE UPLOADS ====================
//uploadthing
/**
 * POST /api/upload/image
 * Upload image (avatar, logo, etc.)
 * Body: FormData with file
 * Returns: { url }
 */

/**
 * POST /api/upload/attachment
 * Upload submission attachment
 * Body: FormData with file
 * Returns: { url }
 */

/**
 * DELETE /api/upload/[fileId]
 * Delete uploaded file
 */

// ==================== WEBHOOKS ====================

/**
 * POST /api/webhooks/solana
 * Webhook for Solana transaction confirmations
 * Body: { signature, status, blockTime }
 */

/**
 * POST /api/webhooks/payment-confirmed
 * Webhook for payment confirmations
 * Body: { paymentId, txSignature, confirmed }
 */

// ==================== HEALTH & UTILITIES ====================

/**
 * GET /api/health
 * Health check endpoint
 */

/**
 * GET /api/config
 * Get public configuration
 * Returns: { platformFee, minBountyAmount, maxResponseDays }
 */

// ==================== TOTAL ROUTES SUMMARY ====================
/**
 * Authentication: 7 routes
 * User Management: 7 routes
 * Company Management: 7 routes
 * Company Members: 4 routes
 * Bounty Management: 9 routes
 * Submission Management: 9 routes
 * Comments: 4 routes
 * Payment Management: 7 routes
 * Reports: 6 routes
 * Notifications: 5 routes
 * Blockchain: 6 routes
 * Admin: 7 routes
 * Analytics: 4 routes
 * Search: 3 routes
 * File Uploads: 3 routes
 * Webhooks: 2 routes
 * Utilities: 2 routes
 *
 * TOTAL: ~92 API endpoints
 */