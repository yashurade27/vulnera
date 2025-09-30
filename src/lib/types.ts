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

// ==================== TYPE DEFINITIONS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyWalletInput = z.infer<typeof verifyWalletSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

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