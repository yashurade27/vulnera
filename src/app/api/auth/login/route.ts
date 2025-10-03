import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { loginSchema } from '@/lib/types';
import { encode } from 'next-auth/jwt';
import { authOptions } from '../[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 403 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Set session cookie
    const isSecure = process.env.NODE_ENV === 'production';
    const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    const maxAge = authOptions.session?.maxAge || 30 * 24 * 60 * 60;

    // Create NextAuth session token
    const token = {
      sub: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.emailVerified,
    };
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not set');
    }
    const encodedToken = await encode({ token, secret, maxAge });

    // Return user data (without sensitive info)
    const { passwordHash: _passwordHash, otp: _otp, otpExpiry: _otpExpiry, resetToken: _resetToken, resetTokenExpiry: _resetTokenExpiry, ...userData } = user;

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userData
      },
      { status: 200 }
    );

    response.cookies.set(cookieName, encodedToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}