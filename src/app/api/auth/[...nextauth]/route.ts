import NextAuth from "next-auth";
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
    role?: string;
    email_verified?: boolean;
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
        token.role = user.role;
        token.email_verified = !!user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN';
        session.user.emailVerified = token.email_verified || false;
      }
      return session;
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };