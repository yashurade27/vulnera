import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { fundBountySchema, type FundBountyInput } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { bountyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bountyId } = params;
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
        canApprovePayment: true, // Assuming this permission for funding
      },
    });

    if (!companyMember) {
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

    // Update bounty with funding information
    const fundedBounty = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        escrowAddress,
        txSignature,
        publishedAt: new Date(), // Mark as published when funded
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

    // TODO: Verify transaction on blockchain
    // This would involve calling a blockchain verification service

    return NextResponse.json({
      message: 'Bounty funded successfully',
      bounty: fundedBounty
    });

  } catch (error) {
    console.error('Fund bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
