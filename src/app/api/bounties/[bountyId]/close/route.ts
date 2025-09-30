import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { closeBountySchema, type CloseBountyInput } from '@/lib/types';

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
        canApprovePayment: true, // Assuming this permission for closing
      },
    });

    if (!companyMember) {
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

    // Close bounty
    const closedBounty = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        // Store the withdrawal transaction signature
        // Note: In a real implementation, you might want a separate field for withdrawal tx
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

    // TODO: Verify withdrawal transaction on blockchain
    // This would involve calling a blockchain verification service

    return NextResponse.json({
      message: 'Bounty closed successfully',
      bounty: closedBounty
    });

  } catch (error) {
    console.error('Close bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
