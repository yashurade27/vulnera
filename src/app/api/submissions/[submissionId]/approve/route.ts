import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { approveSubmissionSchema, type ApproveSubmissionInput } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { submissionId } = params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: true,
        user: true,
        company: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role !== 'ADMIN') {
      if (session.user.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const membership = await prisma.companyMember.findFirst({
        where: {
          userId: session.user.id,
          companyId: submission.companyId,
          isActive: true,
          canApprovePayment: true,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have permission to approve payments for this company' },
          { status: 403 }
        );
      }
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Submission must be pending to be approved' },
        { status: 400 }
      );
    }

    const body: ApproveSubmissionInput = await request.json();
    const parsed = approveSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { rewardAmount } = parsed.data;

    if (rewardAmount <= 0) {
      return NextResponse.json(
        { error: 'Reward amount must be positive' },
        { status: 400 }
      );
    }

    if (rewardAmount > Number(submission.bounty.rewardAmount)) {
      return NextResponse.json(
        { error: 'Reward amount cannot exceed bounty reward' },
        { status: 400 }
      );
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        rewardAmount,
      },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Update bounty stats
    await prisma.bounty.update({
      where: { id: submission.bountyId },
      data: {
        validSubmissions: { increment: 1 },
        paidOut: { increment: rewardAmount },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: 'Submission approved',
        message: `Your submission "${submission.title}" has been approved with a reward of $${rewardAmount}.`,
        type: 'SUBMISSION',
        actionUrl: `/submissions/${submissionId}`,
      },
    });

    return NextResponse.json({ submission: updatedSubmission });

  } catch (error) {
    console.error('Approve submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
