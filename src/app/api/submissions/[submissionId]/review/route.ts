import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reviewSubmissionSchema, type ReviewSubmissionInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function POST(
  request: NextRequest,
  { params }: RouteParams<{ submissionId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { submissionId } = await params;

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

    // Check if user has permission to review (company admin or admin)
    if (session.user.role !== 'ADMIN') {
      if (session.user.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Check if user is member of the company
      const membership = await prisma.companyMember.findFirst({
        where: {
          userId: session.user.id,
          companyId: submission.companyId,
          isActive: true,
          canReviewBounty: true,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have permission to review submissions for this company' },
          { status: 403 }
        );
      }
    }

    // Check if submission is still pending
    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed' },
        { status: 400 }
      );
    }

    const body: ReviewSubmissionInput = await request.json();
    const parsed = reviewSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status, reviewNotes, rejectionReason, rewardAmount } = parsed.data;

    // Validate reward amount if approving
    if (status === 'APPROVED' && rewardAmount) {
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
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNotes,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        rewardAmount: status === 'APPROVED' ? rewardAmount : null,
      },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            rewardAmount: true,
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
    if (status === 'APPROVED') {
      await prisma.bounty.update({
        where: { id: submission.bountyId },
        data: {
          validSubmissions: { increment: 1 },
          paidOut: { increment: rewardAmount || 0 },
        },
      });
    }

    // Create notification for the submitter
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: `Submission ${status.toLowerCase()}`,
        message: `Your submission "${submission.title}" has been ${status.toLowerCase()}.`,
        type: 'SUBMISSION',
        actionUrl: `/submissions/${submissionId}`,
      },
    });

    return NextResponse.json({ submission: updatedSubmission });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
