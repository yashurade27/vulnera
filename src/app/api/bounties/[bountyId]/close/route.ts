import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { closeBountySchema, type CloseBountyInput } from '@/lib/types';
import { solanaService } from '@/lib/solana';
import { type RouteParams } from '@/lib/next';

export async function POST(
  request: NextRequest,
  { params }: RouteParams<{ bountyId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { bountyId } = await params;
    const body: CloseBountyInput = await request.json();
    const parsed = closeBountySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { txSignature } = parsed.data;

    // Check if bounty exists
    const existingBounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { company: true },
    });

    if (!existingBounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to close this bounty
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: existingBounty.companyId,
        isActive: true,
        canApprovePayment: true,
      },
    });

    if (!companyMember && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to close this bounty' },
        { status: 403 }
      );
    }

    // Check if bounty is already closed
    if (existingBounty.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Bounty is already closed' },
        { status: 400 }
      );
    }

    // Check if there are any pending submissions
    const pendingSubmissions = await prisma.submission.count({
      where: {
        bountyId,
        status: 'PENDING',
      },
    });

    if (pendingSubmissions > 0) {
      return NextResponse.json(
        { error: 'Cannot close bounty with pending submissions' },
        { status: 400 }
      );
    }

    // Verify transaction on blockchain
    const txVerification = await solanaService.verifyTransaction(txSignature);
    
    if (!txVerification.confirmed) {
      return NextResponse.json(
        { error: 'Transaction not confirmed on blockchain' },
        { status: 400 }
      );
    }

    // Get transaction details to verify it's a close_bounty call
    const txDetails = await solanaService.getTransaction(txSignature);
    
    if (!txDetails) {
      return NextResponse.json(
        { error: 'Transaction details not found' },
        { status: 400 }
      );
    }

    // Verify escrow is now empty or closed
    let withdrawnAmount = 0;
    if (existingBounty.escrowAddress) {
      const remainingBalance = await solanaService.getEscrowBalance(existingBounty.escrowAddress);
      withdrawnAmount = Number(existingBounty.rewardAmount) * 1_000_000_000 - Number(existingBounty.paidOut) * 1_000_000_000 - remainingBalance;
    }

    // Close bounty
    const closedBounty = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update company's active bounties count
    await prisma.company.update({
      where: { id: existingBounty.companyId },
      data: {
        activeBounties: {
          decrement: 1,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BOUNTY_CLOSED',
        entityType: 'BOUNTY',
        entityId: bountyId,
        newValue: { 
          txSignature, 
          withdrawnAmount,
          closedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      message: 'Bounty closed successfully',
      bounty: closedBounty,
      withdrawnAmount
    });

  } catch (error) {
    console.error('Close bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
