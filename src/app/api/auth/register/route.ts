import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { registerSchema, type RegisterInput } from '@/lib/types';
import { generateOTP, sendOTPEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterInput = await request.json();

    // Validate input with Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, username, password, role, walletAddress } = parsed.data;

    // Check if wallet address is an empty string and set to null if it is
    const normalizedWalletAddress = walletAddress && walletAddress.trim() !== '' ? walletAddress.trim() : null;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          ...(normalizedWalletAddress ? [{ walletAddress: normalizedWalletAddress }] : [])
        ]
      }
    });

    if (existingUser) {
      let errorMsg = 'User already exists';
      if (existingUser.email === email) errorMsg = 'User with this email already exists';
      else if (existingUser.username === username) errorMsg = 'Username already taken';
      else if (normalizedWalletAddress && existingUser.walletAddress === normalizedWalletAddress) errorMsg = 'Wallet address already in use';

      return NextResponse.json(
        { error: errorMsg },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    // Create user with OTP (emailVerified = false)
    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashedPassword,
        role,
        walletAddress: normalizedWalletAddress,
        emailVerified: false,
        otp,
        otpExpiry
      }
    });

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email for OTP verification.',
        email: email
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
