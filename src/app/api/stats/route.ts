import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Aggregate user stats
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });
    const bountyHunters = await prisma.user.count({
      where: { role: 'BOUNTY_HUNTER' }
    });
    const companyAdmins = await prisma.user.count({
      where: { role: 'COMPANY_ADMIN' }
    });

    // Aggregate company stats
    const totalCompanies = await prisma.company.count();
    const activeCompanies = await prisma.company.count({
      where: { isActive: true }
    });
    const verifiedCompanies = await prisma.company.count({
      where: { isVerified: true }
    });

    // Aggregate bounty stats
    const totalBounties = await prisma.bounty.count();
    const activeBounties = await prisma.bounty.count({
      where: { status: 'ACTIVE' }
    });
    const totalBountyValue = await prisma.bounty.aggregate({
      _sum: { rewardAmount: true }
    });

    // Aggregate submission stats
    const totalSubmissions = await prisma.submission.count();
    const approvedSubmissions = await prisma.submission.count({
      where: { status: 'APPROVED' }
    });
    const pendingSubmissions = await prisma.submission.count({
      where: { status: 'PENDING' }
    });

    // Aggregate payment stats
    const totalPayments = await prisma.payment.count();
    const completedPayments = await prisma.payment.count({
      where: { status: 'COMPLETED' }
    });
    const totalVolume = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' }
    });

    // Get latest platform stats if available
    const latestStats = await prisma.platformStats.findFirst({
      orderBy: { date: 'desc' }
    });

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        bountyHunters,
        companyAdmins
      },
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        verified: verifiedCompanies
      },
      bounties: {
        total: totalBounties,
        active: activeBounties,
        totalValue: totalBountyValue._sum.rewardAmount || 0
      },
      submissions: {
        total: totalSubmissions,
        approved: approvedSubmissions,
        pending: pendingSubmissions
      },
      payments: {
        total: totalPayments,
        completed: completedPayments,
        totalVolume: totalVolume._sum.amount || 0
      },
      latestDailyStats: latestStats ? {
        date: latestStats.date,
        newUsers: latestStats.newUsers,
        newBounties: latestStats.newBounties,
        newSubmissions: latestStats.newSubmissions,
        paymentsMade: latestStats.paymentsMade
      } : null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}