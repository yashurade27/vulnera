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
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
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

// ==================== TYPE DEFINITIONS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyWalletInput = z.infer<typeof verifyWalletSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
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
  email: string;
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