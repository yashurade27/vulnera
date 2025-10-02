import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  role: z.enum(['BOUNTY_HUNTER', 'COMPANY_ADMIN']),
  walletAddress: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyWalletSchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
  message: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const verifyOtpFormSchema = z.object({
  otp: z.string().length(6),
});

// ==================== USER SCHEMAS ====================

export const updateUserProfileSchema = z.object({
  fullName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  country: z.string().max(50).optional(),
  githubUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().url().optional(),
  portfolioUrl: z.string().url().optional(),
});

export const updateWalletSchema = z.object({
  walletAddress: z.string(),
  signature: z.string(),
  message: z.string(),
});

// ==================== COMPANY SCHEMAS ====================

export const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
  walletAddress: z.string(),
  industry: z.string().max(50).optional(),
  companySize: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
  logoUrl: z.string().url().optional(),
});

export const registerCompanyOnChainSchema = z.object({
  companyId: z.string(),
  txSignature: z.string().min(1),
  smartContractAddress: z.string().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
  walletAddress: z.string().optional(),
  logoUrl: z.string().url().optional(),
  industry: z.string().max(50).optional(),
  companySize: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
});

export const getCompaniesQuerySchema = z.object({
  search: z.string().optional(),
  verified: z.enum(['true', 'false']).optional(),
  active: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const getCompanyBountiesQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED', 'EXPIRED']).optional(),
  type: z.enum(['UI', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const inviteMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['COMPANY_ADMIN']).default('COMPANY_ADMIN'),
  canCreateBounty: z.boolean().default(false),
  canReviewBounty: z.boolean().default(false),
  canApprovePayment: z.boolean().default(false),
  canManageMembers: z.boolean().default(false),
});

export const updateMemberSchema = z.object({
  role: z.enum(['COMPANY_ADMIN']).optional(),
  canCreateBounty: z.boolean().optional(),
  canReviewBounty: z.boolean().optional(),
  canApprovePayment: z.boolean().optional(),
  canManageMembers: z.boolean().optional(),
});

export const getMembersQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// ==================== BOUNTY SCHEMAS ====================

export const createBountySchema = z.object({
  companyId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  bountyType: z.enum(['UI', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY']),
  targetUrl: z.string().url().optional(),
  rewardAmount: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)),
  maxSubmissions: z.number().int().positive().optional(),
  inScope: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
  requirements: z.string().min(1).max(2000),
  guidelines: z.string().max(2000).optional(),
  startsAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endsAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  responseDeadline: z.number().int().min(1).max(365).default(21), // days
});

export const updateBountySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  bountyType: z.enum(['UI', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY']).optional(),
  targetUrl: z.string().url().optional(),
  rewardAmount: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)).optional(),
  maxSubmissions: z.number().int().positive().optional(),
  inScope: z.array(z.string()).optional(),
  outOfScope: z.array(z.string()).optional(),
  requirements: z.string().min(1).max(2000).optional(),
  guidelines: z.string().max(2000).optional(),
  startsAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endsAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  responseDeadline: z.number().int().min(1).max(365).optional(),
});

export const fundBountySchema = z.object({
  txSignature: z.string(),
  escrowAddress: z.string(),
});

export const closeBountySchema = z.object({
  txSignature: z.string(),
});

export const getBountySubmissionsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'SPAM', 'NEEDS_MORE_INFO']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const getBountiesQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED', 'EXPIRED']).optional(),
  type: z.enum(['UI', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY']).optional(),
  companyId: z.string().optional(),
  search: z.string().optional(),
  minReward: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)).optional(),
  maxReward: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'rewardAmount', 'endsAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== SUBMISSION SCHEMAS ====================

export const createSubmissionSchema = z.object({
  bountyId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  bountyType: z.enum(['UI', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY']),
  vulnerabilityType: z.string().min(1).max(100),
  stepsToReproduce: z.string().min(1).max(5000),
  impact: z.string().min(1).max(2000),
  proofOfConcept: z.string().max(5000).optional(),
  attachments: z.array(z.string().url()).default([]),
});

export const updateSubmissionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  stepsToReproduce: z.string().min(1).max(5000).optional(),
  impact: z.string().min(1).max(2000).optional(),
  proofOfConcept: z.string().max(5000).optional(),
  attachments: z.array(z.string().url()).optional(),
});

export const reviewSubmissionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'DUPLICATE', 'SPAM', 'NEEDS_MORE_INFO']),
  reviewNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
  rewardAmount: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)).optional(),
});

export const approveSubmissionSchema = z.object({
  rewardAmount: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)),
});

export const rejectSubmissionSchema = z.object({
  rejectionReason: z.string().min(1).max(500),
});

export const requestInfoSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const getSubmissionsQuerySchema = z.object({
  bountyId: z.string().optional(),
  userId: z.string().optional(),
  companyId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE', 'SPAM', 'NEEDS_MORE_INFO']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'submittedAt']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== COMMENT SCHEMAS ====================

export const getCommentsQuerySchema = z.object({
  includeInternal: z.enum(['true', 'false']).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ==================== PAYMENT SCHEMAS ====================

export const createPaymentSchema = z.object({
  submissionId: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)),
  platformFee: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)).optional(),
  txSignature: z.string(),
  fromWallet: z.string(),
  toWallet: z.string(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  failureReason: z.string().max(500).optional(),
  confirmations: z.number().int().min(0).optional(),
  completedAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export const verifyPaymentSchema = z.object({
  txSignature: z.string(),
  confirmations: z.number().int().min(0),
});

export const getPaymentsQuerySchema = z.object({
  userId: z.string().optional(),
  companyId: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['initiatedAt', 'completedAt', 'amount']).default('initiatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getUserPaymentsQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['initiatedAt', 'completedAt', 'amount']).default('initiatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getCompanyPaymentsQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['initiatedAt', 'completedAt', 'amount']).default('initiatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== REPORT SCHEMAS ====================

export const createReportSchema = z.object({
  type: z.enum(['LATE_RESPONSE', 'UNFAIR_REJECTION', 'SPAM_SUBMISSION', 'INAPPROPRIATE_CONTENT', 'OTHER']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  evidence: z.array(z.string().url()).default([]),
  submissionId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reportedCompanyId: z.string().optional(),
}).refine((data) => data.submissionId || data.reportedUserId || data.reportedCompanyId, {
  message: "At least one of submissionId, reportedUserId, or reportedCompanyId must be provided",
});

export const updateReportSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED']).optional(),
  resolution: z.string().max(2000).optional(),
  actionTaken: z.string().max(500).optional(),
});

export const resolveReportSchema = z.object({
  resolution: z.string().min(1).max(2000),
  actionTaken: z.string().max(500).optional(),
});

export const getReportsQuerySchema = z.object({
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED']).optional(),
  type: z.enum(['LATE_RESPONSE', 'UNFAIR_REJECTION', 'SPAM_SUBMISSION', 'INAPPROPRIATE_CONTENT', 'OTHER']).optional(),
  reporterId: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== NOTIFICATION SCHEMAS ====================

export const getNotificationsQuerySchema = z.object({
  isRead: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'readAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== AUDIT LOG SCHEMAS ====================

export const getAuditLogsQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== SEARCH SCHEMAS ====================

export const globalSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['bounties', 'companies', 'users']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const searchBountiesQuerySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['UI', 'FUNCTIONALITY', 'PERFORMANCE', 'SECURITY']).optional(),
  minReward: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)).optional(),
  maxReward: z.string().regex(/^\d+(\.\d{1,9})?$/).transform(val => parseFloat(val)).optional(),
  companyId: z.string().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'EXPIRED']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'rewardAmount', 'endsAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchCompaniesQuerySchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  verified: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['createdAt', 'name', 'totalBountiesFunded']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== UPLOAD SCHEMAS ====================

export const uploadImageSchema = z.object({
  // File validation is done in the route handler
});

export const uploadAttachmentSchema = z.object({
  // File validation is done in the route handler
});

export const deleteFileSchema = z.object({
  fileId: z.string(),
});

// ==================== WEBHOOK SCHEMAS ====================

export const solanaWebhookSchema = z.object({
  signature: z.string().length(88), // Solana signatures are 88 characters base58
  status: z.enum(['confirmed', 'failed', 'pending']),
  blockTime: z.number().optional(),
});

export const paymentConfirmedWebhookSchema = z.object({
  paymentId: z.string(),
  txSignature: z.string().length(88),
  confirmed: z.boolean(),
  confirmations: z.number().int().min(0).optional(),
  blockTime: z.number().optional(),
});

// ==================== TYPE DEFINITIONS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyWalletInput = z.infer<typeof verifyWalletSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type VerifyOtpFormInput = z.infer<typeof verifyOtpFormSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type RegisterCompanyOnChainInput = z.infer<typeof registerCompanyOnChainSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type GetCompaniesQuery = z.infer<typeof getCompaniesQuerySchema>;
export type GetCompanyBountiesQuery = z.infer<typeof getCompanyBountiesQuerySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type GetMembersQuery = z.infer<typeof getMembersQuerySchema>;
export type CreateBountyInput = z.infer<typeof createBountySchema>;
export type UpdateBountyInput = z.infer<typeof updateBountySchema>;
export type FundBountyInput = z.infer<typeof fundBountySchema>;
export type CloseBountyInput = z.infer<typeof closeBountySchema>;
export type GetBountySubmissionsQuery = z.infer<typeof getBountySubmissionsQuerySchema>;
export type GetBountiesQuery = z.infer<typeof getBountiesQuerySchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
export type ApproveSubmissionInput = z.infer<typeof approveSubmissionSchema>;
export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;
export type RequestInfoInput = z.infer<typeof requestInfoSchema>;
export type GetSubmissionsQuery = z.infer<typeof getSubmissionsQuerySchema>;
export type GetCommentsQuery = z.infer<typeof getCommentsQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type GetPaymentsQuery = z.infer<typeof getPaymentsQuerySchema>;
export type GetUserPaymentsQuery = z.infer<typeof getUserPaymentsQuerySchema>;
export type GetCompanyPaymentsQuery = z.infer<typeof getCompanyPaymentsQuerySchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type GetReportsQuery = z.infer<typeof getReportsQuerySchema>;
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;
export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
export type SearchBountiesQuery = z.infer<typeof searchBountiesQuerySchema>;
export type SearchCompaniesQuery = z.infer<typeof searchCompaniesQuerySchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type SolanaWebhookInput = z.infer<typeof solanaWebhookSchema>;
export type PaymentConfirmedWebhookInput = z.infer<typeof paymentConfirmedWebhookSchema>;

export interface DbUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: boolean;
  walletAddress?: string | null;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  totalEarnings: number;
  totalBounties: number;
  reputation: number;
  rank?: number | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  otp?: string | null;
  otpExpiry?: Date | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface ExtendedUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  username: string;
  role: 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: boolean;
  walletAddress?: string | null;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  totalEarnings: number;
  totalBounties: number;
  reputation: number;
  rank?: number | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
}