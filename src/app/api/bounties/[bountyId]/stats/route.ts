import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { bountyId: string } }
) {
  try {
    const { bountyId } = params;

    // Check if bounty exists
    const existingBounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!existingBounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    // Get comprehensive statistics
    const [
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      duplicateSubmissions,
      spamSubmissions,
      needsMoreInfoSubmissions,
      totalPaid,
      averageSubmissionTime,
      topSubmitters,
    ] = await Promise.all([
      // Total submissions count
      prisma.submission.count({
        where: { bountyId },
      }),

      // Pending submissions
      prisma.submission.count({
        where: { bountyId, status: 'PENDING' },
      }),

      // Approved submissions
      prisma.submission.count({
        where: { bountyId, status: 'APPROVED' },
      }),

      // Rejected submissions
      prisma.submission.count({
        where: { bountyId, status: 'REJECTED' },
      }),

      // Duplicate submissions
      prisma.submission.count({
        where: { bountyId, status: 'DUPLICATE' },
      }),

      // Spam submissions
      prisma.submission.count({
        where: { bountyId, status: 'SPAM' },
      }),

      // Needs more info submissions
      prisma.submission.count({
        where: { bountyId, status: 'NEEDS_MORE_INFO' },
      }),

      // Total amount paid
      prisma.payment.aggregate({
        where: {
          submission: { bountyId },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),

      // Average time to review submissions (calculate manually)
      prisma.submission.findMany({
        where: {
          bountyId,
          reviewedAt: { not: null },
        },
        select: {
          submittedAt: true,
          reviewedAt: true,
        },
      }),

      // Top submitters for this bounty
      prisma.submission.groupBy({
        by: ['userId'],
        where: { bountyId },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Get top submitters with user details
    const topSubmittersWithDetails = await Promise.all(
      topSubmitters.map(async (submitter) => {
        const user = await prisma.user.findUnique({
          where: { id: submitter.userId },
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            reputation: true,
          },
        });
        return {
          user,
          submissionCount: submitter._count.id,
        };
      })
    );

    // Calculate average review time
    let averageReviewTimeHours = 0;
    if (averageSubmissionTime.length > 0) {
      const totalReviewTime = averageSubmissionTime.reduce((acc, submission) => {
        if (submission.reviewedAt && submission.submittedAt) {
          const reviewTime = submission.reviewedAt.getTime() - submission.submittedAt.getTime();
          return acc + reviewTime;
        }
        return acc;
      }, 0);
      averageReviewTimeHours = (totalReviewTime / averageSubmissionTime.length) / (1000 * 60 * 60); // Convert to hours
    }

    const stats = {
      totalSubmissions,
      submissionsByStatus: {
        pending: pendingSubmissions,
        approved: approvedSubmissions,
        rejected: rejectedSubmissions,
        duplicate: duplicateSubmissions,
        spam: spamSubmissions,
        needsMoreInfo: needsMoreInfoSubmissions,
      },
      totalPaid: totalPaid._sum.amount || 0,
      averageReviewTimeHours,
      topSubmitters: topSubmittersWithDetails,
      bountyDetails: {
        status: existingBounty.status,
        rewardAmount: existingBounty.rewardAmount,
        maxSubmissions: existingBounty.maxSubmissions,
        startsAt: existingBounty.startsAt,
        endsAt: existingBounty.endsAt,
        createdAt: existingBounty.createdAt,
      },
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Get bounty stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
