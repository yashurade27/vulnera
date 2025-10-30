import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateWalletSchema, type UpdateWalletInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ userId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { userId } = await params;

    // Only allow users to update their own wallet or admins
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body: UpdateWalletInput = await request.json();
    const parsed = updateWalletSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { walletAddress, signature, message } = parsed.data;

    // Validate Solana wallet address format
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Solana wallet address. Please enter a valid address.' },
        { status: 400 }
      );
    }

    // Verify signature against wallet address if provided
    if (signature && message) {
      try {
        const publicKey = new PublicKey(walletAddress);
        const signatureBytes = bs58.decode(signature);
        const messageBytes = new TextEncoder().encode(message);

        const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid signature. Please sign the exact message shown.' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Signature verification error:', error);
        return NextResponse.json(
          { error: 'Failed to verify signature. Please ensure you signed the correct message.' },
          { status: 400 }
        );
      }
    }

    // Check if wallet is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Wallet address already in use' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        walletAddress: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        country: true,
        githubUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        portfolioUrl: true,
        totalEarnings: true,
        totalBounties: true,
        reputation: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('Update wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}