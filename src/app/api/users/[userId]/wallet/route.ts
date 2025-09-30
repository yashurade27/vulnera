import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateWalletSchema, type UpdateWalletInput } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

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

    const { walletAddress, signature } = parsed.data;

    // TODO: Verify signature against wallet address
    // For now, just update if authorized

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
        walletAddress: true,
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