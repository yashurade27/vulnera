import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fundBountySchema, type FundBountyInput } from '@/lib/types';
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
    const body: FundBountyInput = await request.json();
    const parsed = fundBountySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { txSignature, escrowAddress } = parsed.data;

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

    // Check if user has permission to fund this bounty
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
        { error: 'Forbidden - You do not have permission to fund this bounty' },
        { status: 403 }
      );
    }

    // Check if bounty is already funded
    if (existingBounty.escrowAddress) {
      return NextResponse.json(
        { error: 'Bounty is already funded' },
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

    // Retry mechanism to allow RPC node to catch up
    let escrowData: { owner: string; escrowAmount: number; } | null = null;
    for (let i = 0; i < 5; i++) {
      escrowData = await solanaService.getEscrowData(escrowAddress);
      if (escrowData) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    
    if (!escrowData) {
      return NextResponse.json(
        { error: 'Escrow account not found or not initialized after multiple attempts' },
        { status: 400 }
      );
    }

    // Validate escrow owner - should match either company wallet or be a valid member wallet
    const companyWallet = existingBounty.company.walletAddress;
    
    // If company wallet is not set or doesn't match, update it with the escrow owner
    if (!companyWallet) {
      await prisma.company.update({
        where: { id: existingBounty.companyId },
        data: { walletAddress: escrowData.owner }
      });
    } else if (escrowData.owner !== companyWallet) {
      // Allow if the user creating the escrow is a company member with payment permissions
      if (!companyMember) {
        return NextResponse.json(
          { error: 'Escrow owner does not match company wallet' },
          { status: 400 }
        );
      }
      // Update company wallet to the current escrow owner (the connected wallet)
      await prisma.company.update({
        where: { id: existingBounty.companyId },
        data: { walletAddress: escrowData.owner }
      });
    }

    // Verify escrow amount matches bounty reward pool
    const reward = Number(existingBounty.rewardAmount);
    const maxSubmissions = existingBounty.maxSubmissions ?? 1;
    const totalExpectedAmount = reward * maxSubmissions;
    const totalExpectedLamports = totalExpectedAmount * 1_000_000_000;

    if (escrowData.escrowAmount < totalExpectedLamports) {
      return NextResponse.json(
        { error: `Escrow amount (${escrowData.escrowAmount}) is less than the total expected amount (${totalExpectedLamports})` },
        { status: 400 }
      );
    }

    // Update bounty with funding information
    const fundedBounty = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        escrowAddress,
        txSignature,
        // Set bounty to ACTIVE when funded
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
          },
        },
      },
    });

    // Update company stats
    await prisma.company.update({
      where: { id: existingBounty.companyId },
      data: {
        totalBountiesFunded: { increment: existingBounty.rewardAmount },
        activeBounties: { increment: 1 }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BOUNTY_FUNDED',
        entityType: 'BOUNTY',
        entityId: bountyId,
        newValue: { txSignature, escrowAddress, escrowAmount: escrowData.escrowAmount }
      }
    });

    return NextResponse.json({
      message: 'Bounty funded successfully',
      bounty: {
        ...fundedBounty,
        rewardAmount: Number(fundedBounty.rewardAmount),
      },
      escrowAmount: escrowData.escrowAmount,
      escrowBalanceLamports: escrowData.escrowAmount,
    });

  } catch (error) {
    console.error('Fund bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
