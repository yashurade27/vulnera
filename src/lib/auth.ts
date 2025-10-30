import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { loginSchema, type ExtendedUser } from "@/lib/types";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
  
  interface User extends ExtendedUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string;
    role?: string;
    email_verified?: boolean;
    fullName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
    walletAddress?: string | null;
    bio?: string | null;
    country?: string | null;
    githubUrl?: string | null;
    twitterUrl?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
    status?: string;
    totalEarnings?: number;
    totalBounties?: number;
    reputation?: number;
    rank?: number | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
          throw new Error("Account is not active");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          walletAddress: user.walletAddress,
          fullName: user.fullName,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          country: user.country,
          totalEarnings: Number(user.totalEarnings || 0),
          totalBounties: Number(user.totalBounties || 0),
          reputation: user.reputation,
          rank: user.rank,
          githubUrl: user.githubUrl,
          twitterUrl: user.twitterUrl,
          linkedinUrl: user.linkedinUrl,
          portfolioUrl: user.portfolioUrl,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? token.email;
        if (!token.email) {
          token.email = "";
        }
        token.role = user.role;
        token.email_verified = !!user.emailVerified;
        token.fullName = user.fullName ?? null;
        token.username = user.username ?? null;
        token.avatarUrl = user.avatarUrl ?? null;
        token.walletAddress = user.walletAddress ?? null;
        token.bio = user.bio ?? null;
        token.country = user.country ?? null;
        token.githubUrl = user.githubUrl ?? null;
        token.twitterUrl = user.twitterUrl ?? null;
        token.linkedinUrl = user.linkedinUrl ?? null;
        token.portfolioUrl = user.portfolioUrl ?? null;
        token.status = user.status;
        token.totalEarnings = Number(user.totalEarnings ?? 0);
        token.totalBounties = Number(user.totalBounties ?? 0);
        token.reputation = Number(user.reputation ?? 0);
        token.rank = user.rank ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.sub) {
        return session;
      }

      const email = token.email ?? session.user?.email ?? "";
      const username = token.username ?? session.user?.username ?? email;
      const status = token.status as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | undefined;

      const enrichedUser: ExtendedUser = {
        id: token.sub,
        name: token.fullName || token.username || token.email,
        email,
        image: token.avatarUrl || null,
        username,
        role: (token.role as 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN') ?? session.user?.role ?? 'BOUNTY_HUNTER',
        status: status ?? session.user?.status ?? 'ACTIVE',
        emailVerified: token.email_verified ?? session.user?.emailVerified ?? false,
        fullName: token.fullName ?? session.user?.fullName ?? null,
        avatarUrl: token.avatarUrl ?? session.user?.avatarUrl ?? null,
        walletAddress: token.walletAddress ?? session.user?.walletAddress ?? null,
        bio: token.bio ?? session.user?.bio ?? null,
        country: token.country ?? session.user?.country ?? null,
        githubUrl: token.githubUrl ?? session.user?.githubUrl ?? null,
        twitterUrl: token.twitterUrl ?? session.user?.twitterUrl ?? null,
        linkedinUrl: token.linkedinUrl ?? session.user?.linkedinUrl ?? null,
        portfolioUrl: token.portfolioUrl ?? session.user?.portfolioUrl ?? null,
        totalEarnings: token.totalEarnings ?? session.user?.totalEarnings ?? 0,
        totalBounties: token.totalBounties ?? session.user?.totalBounties ?? 0,
        reputation: token.reputation ?? session.user?.reputation ?? 0,
        rank: token.rank ?? session.user?.rank ?? null,
      };

      return {
        ...session,
        user: enrichedUser,
      };
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
};

