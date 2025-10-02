import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { type RouteParams } from '@/lib/next';

const updateUserByAdminSchema = z.object({
  role: z.enum(['BOUNTY_HUNTER', 'COMPANY_ADMIN', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  emailVerified: z.boolean().optional(),
  reputation: z
    .number()
    .min(0, { message: 'Reputation cannot be negative' })
    .max(10000, { message: 'Reputation too high' })
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ userId: string }>
) {
  try {
    // Get session and check admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

  const { userId } = await params;

    const body = await request.json();
    const parsed = updateUserByAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        emailVerified: true,
        walletAddress: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        country: true,
        totalEarnings: true,
        totalBounties: true,
        reputation: true,
        rank: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('Update user by admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
