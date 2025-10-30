import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWalletSchema } from '@/lib/types';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

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

    const { walletAddress, signature, message } = parsed.data;

    // Verify Solana signature
    try {
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      
      const verified = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid signature - wallet ownership could not be verified' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Signature verification failed:', error);
      return NextResponse.json(
        { error: 'Signature verification failed. Please try again.' },
        { status: 401 }
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
