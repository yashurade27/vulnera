import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateBountySchema, type UpdateBountyInput } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bountyId: string }> }
) {
  try {
    const { bountyId } = await params;

    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            walletAddress: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ bounty });

  } catch (error) {
    console.error('Get bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bountyId: string }> }
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
    const body: UpdateBountyInput = await request.json();
    const parsed = updateBountySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

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

    // Check if user has permission to update this bounty
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: existingBounty.companyId,
        isActive: true,
        canCreateBounty: true, // Assuming same permission for updating
      },
    });

    if (!companyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to update this bounty' },
        { status: 403 }
      );
    }

    // Validate dates if provided
    const updateData = parsed.data;
    if (updateData.startsAt && updateData.startsAt <= new Date()) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      );
    }

    if (updateData.endsAt && updateData.startsAt && updateData.endsAt <= updateData.startsAt) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Update bounty
    const updatedBounty = await prisma.bounty.update({
      where: { id: bountyId },
      data: updateData,
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
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json({ bounty: updatedBounty });

  } catch (error) {
    console.error('Update bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bountyId: string }> }
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

    // Check if user has permission to delete this bounty
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: existingBounty.companyId,
        isActive: true,
        canCreateBounty: true, // Assuming same permission for deleting
      },
    });

    if (!companyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to delete this bounty' },
        { status: 403 }
      );
    }

    // Check if bounty has approved submissions that haven't been paid yet
    const unpaidApprovedSubmissions = await prisma.submission.count({
      where: {
        bountyId,
        status: 'APPROVED',
        paymentId: null,
      },
    });

    if (unpaidApprovedSubmissions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete bounty with unpaid approved submissions' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to CLOSED and closedAt timestamp
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

    return NextResponse.json({
      message: 'Bounty closed successfully',
      bounty: closedBounty
    });

  } catch (error) {
    console.error('Delete bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
