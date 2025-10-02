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
    const bountyStats = await prisma.bounty.groupBy({
      by: ['status', 'bountyType'],
      where: { companyId },
      _count: { id: true },
      _sum: {
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
    const totalBounties = bountyStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const activeBounties = bountyStats
      .filter(stat => stat.status === 'ACTIVE')
      .reduce((sum, stat) => sum + stat._count.id, 0);
    const totalBountiesFunded = bountyStats.reduce((sum, stat) => sum + Number(stat._sum.rewardAmount || 0), 0);
    const totalPaidOut = bountyStats.reduce((sum, stat) => sum + Number(stat._sum.paidOut || 0), 0);

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
      bountyBreakdown: bountyStats.map(stat => ({
        status: stat.status,
        type: stat.bountyType,
        count: stat._count.id,
        totalReward: Number(stat._sum.rewardAmount || 0),
        totalSubmissions: stat._sum.totalSubmissions || 0,
        validSubmissions: stat._sum.validSubmissions || 0,
        paidOut: Number(stat._sum.paidOut || 0),
      })),
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
