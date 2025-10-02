import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Get session and check admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get comprehensive platform statistics
    const [
      totalUsers,
      totalCompanies,
      totalBounties,
      activeBounties,
      totalSubmissions,
      resolvedVulnerabilities,
      userStats,
      companyStats,
      bountyStats,
      submissionStats,
      paymentStats,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.company.count(),
      prisma.bounty.count(),
      prisma.bounty.count({ where: { status: 'ACTIVE' } }),
      prisma.submission.count(),

      // Resolved vulnerabilities (approved submissions)
      prisma.submission.count({ where: { status: 'APPROVED' } }),

      // User statistics
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Company statistics
      prisma.company.groupBy({
        by: ['isVerified'],
        _count: { isVerified: true },
      }),

      // Bounty statistics
      prisma.bounty.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { rewardAmount: true },
      }),

      // Submission statistics
      prisma.submission.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Payment statistics
      prisma.payment.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { amount: true },
      }),
    ]);

    // Calculate totals
    const totalBountyReward = bountyStats.reduce((sum, stat) => sum + Number(stat._sum.rewardAmount || 0), 0);
    const totalPaidAmount = Number(paymentStats.find(p => p.status === 'COMPLETED')?._sum.amount || 0);

    // Structure the response
    const stats = {
      overview: {
        totalUsers,
        totalCompanies,
        totalBounties,
        activeBounties,
        totalSubmissions,
        resolvedVulnerabilities,
        totalPayments: totalPaidAmount,
        totalBountyRewards: totalBountyReward,
      },
      userBreakdown: {
        bountyHunters: userStats.find(s => s.role === 'BOUNTY_HUNTER')?._count.role || 0,
        companyAdmins: userStats.find(s => s.role === 'COMPANY_ADMIN')?._count.role || 0,
        admins: userStats.find(s => s.role === 'ADMIN')?._count.role || 0,
      },
      companyBreakdown: {
        verified: companyStats.find(s => s.isVerified)?._count.isVerified || 0,
        unverified: companyStats.find(s => !s.isVerified)?._count.isVerified || 0,
      },
      bountyBreakdown: {
        active: bountyStats.find(s => s.status === 'ACTIVE')?._count.status || 0,
        closed: bountyStats.find(s => s.status === 'CLOSED')?._count.status || 0,
        expired: bountyStats.find(s => s.status === 'EXPIRED')?._count.status || 0,
      },
      submissionBreakdown: {
        pending: submissionStats.find(s => s.status === 'PENDING')?._count.status || 0,
        approved: submissionStats.find(s => s.status === 'APPROVED')?._count.status || 0,
        rejected: submissionStats.find(s => s.status === 'REJECTED')?._count.status || 0,
        duplicate: submissionStats.find(s => s.status === 'DUPLICATE')?._count.status || 0,
        spam: submissionStats.find(s => s.status === 'SPAM')?._count.status || 0,
        needsMoreInfo: submissionStats.find(s => s.status === 'NEEDS_MORE_INFO')?._count.status || 0,
      },
      paymentBreakdown: {
        pending: paymentStats.find(s => s.status === 'PENDING')?._count.status || 0,
        processing: paymentStats.find(s => s.status === 'PROCESSING')?._count.status || 0,
        completed: paymentStats.find(s => s.status === 'COMPLETED')?._count.status || 0,
        failed: paymentStats.find(s => s.status === 'FAILED')?._count.status || 0,
        refunded: paymentStats.find(s => s.status === 'REFUNDED')?._count.status || 0,
      },
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
