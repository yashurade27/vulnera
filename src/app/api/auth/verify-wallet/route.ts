import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWalletSchema } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = verifyWalletSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { walletAddress, signature } = parsed.data;

    // TODO: Implement actual Solana signature verification
    // For now, just check if wallet is provided and signature is present
    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: 'Wallet address and signature required' },
        { status: 400 }
      );
    }

    // Check if wallet is already taken
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Wallet address already linked to another account' },
        { status: 409 }
      );
    }

    // For demo purposes, assume signature is valid
    // In production, verify the signature against the message

    return NextResponse.json(
      {
        message: 'Wallet verified successfully',
        walletAddress
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Wallet verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}