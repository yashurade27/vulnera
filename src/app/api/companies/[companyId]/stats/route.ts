import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type RouteParams } from '@/lib/next';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string }>
) {
  try {
    const { companyId } = await params;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get bounty statistics
    const bountyRecords = await prisma.bounty.findMany({
      where: { companyId },
      select: {
        status: true,
        bountyTypes: true,
        rewardAmount: true,
        totalSubmissions: true,
        validSubmissions: true,
        paidOut: true,
      },
    });

    // Get submission statistics
    const submissionStats = await prisma.submission.groupBy({
      by: ['status', 'bountyType'],
      where: { companyId },
      _count: { id: true },
      _sum: { rewardAmount: true },
    });

    // Get payment statistics
    const paymentStats = await prisma.payment.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
      _sum: {
        amount: true,
        platformFee: true,
        netAmount: true,
      },
    });

    // Calculate totals
    const totalBounties = bountyRecords.length;
    const activeBounties = bountyRecords.filter((stat) => stat.status === 'ACTIVE').length;
    const totalBountiesFunded = bountyRecords.reduce(
      (sum, stat) => sum + Number(stat.rewardAmount ?? 0),
      0,
    );
    const totalPaidOut = bountyRecords.reduce((sum, stat) => sum + Number(stat.paidOut ?? 0), 0);

    const totalSubmissions = submissionStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const approvedSubmissions = submissionStats
      .filter(stat => stat.status === 'APPROVED')
      .reduce((sum, stat) => sum + stat._count.id, 0);
    const totalRewardsPaid = submissionStats
      .filter(stat => stat.status === 'APPROVED')
      .reduce((sum, stat) => sum + Number(stat._sum.rewardAmount || 0), 0);

    const totalPayments = paymentStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const completedPayments = paymentStats
      .filter(stat => stat.status === 'COMPLETED')
      .reduce((sum, stat) => sum + stat._count.id, 0);
    const totalPlatformFees = paymentStats
      .filter(stat => stat.status === 'COMPLETED')
      .reduce((sum, stat) => sum + Number(stat._sum.platformFee || 0), 0);

    // Get member statistics
    const memberStats = await prisma.companyMember.groupBy({
      by: ['role', 'isActive'],
      where: { companyId },
      _count: { id: true },
    });

    const activeMembers = memberStats
      .filter(stat => stat.isActive)
      .reduce((sum, stat) => sum + stat._count.id, 0);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentBounties = await prisma.bounty.count({
      where: {
        companyId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const recentSubmissions = await prisma.submission.count({
      where: {
        companyId,
        submittedAt: { gte: thirtyDaysAgo },
      },
    });

    const recentPayments = await prisma.payment.count({
      where: {
        companyId,
        initiatedAt: { gte: thirtyDaysAgo },
      },
    });

    const stats = {
      overview: {
        totalBounties,
        activeBounties,
        totalBountiesFunded,
        totalPaidOut,
        totalSubmissions,
        approvedSubmissions,
        totalRewardsPaid,
        totalPayments,
        completedPayments,
        totalPlatformFees,
        activeMembers,
      },
      recentActivity: {
        bountiesLast30Days: recentBounties,
        submissionsLast30Days: recentSubmissions,
        paymentsLast30Days: recentPayments,
      },
      bountyBreakdown: (() => {
        const breakdownMap = new Map<
          string,
          {
            status: string
            type: string
            count: number
            totalReward: number
            totalSubmissions: number
            validSubmissions: number
            paidOut: number
          }
        >();

        for (const bounty of bountyRecords) {
          const reward = Number(bounty.rewardAmount ?? 0);
          const submissions = bounty.totalSubmissions ?? 0;
          const valid = bounty.validSubmissions ?? 0;
          const paidOutAmount = Number(bounty.paidOut ?? 0);
          const types = Array.isArray(bounty.bountyTypes) && bounty.bountyTypes.length
            ? bounty.bountyTypes
            : ['UNSPECIFIED'];

          for (const type of types) {
            const key = `${bounty.status}::${type}`;
            const existing = breakdownMap.get(key) ?? {
              status: bounty.status,
              type,
              count: 0,
              totalReward: 0,
              totalSubmissions: 0,
              validSubmissions: 0,
              paidOut: 0,
            };

            existing.count += 1;
            existing.totalReward += reward;
            existing.totalSubmissions += submissions;
            existing.validSubmissions += valid;
            existing.paidOut += paidOutAmount;

            breakdownMap.set(key, existing);
          }
        }

        return Array.from(breakdownMap.values());
      })(),
      submissionBreakdown: submissionStats.map(stat => ({
        status: stat.status,
        type: stat.bountyType,
        count: stat._count.id,
        totalRewards: Number(stat._sum.rewardAmount || 0),
      })),
      paymentBreakdown: paymentStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        totalAmount: Number(stat._sum.amount || 0),
        totalPlatformFees: Number(stat._sum.platformFee || 0),
        totalNetAmount: Number(stat._sum.netAmount || 0),
      })),
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Get company stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
