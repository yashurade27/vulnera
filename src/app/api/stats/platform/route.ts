import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Aggregate user stats
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });

    // Aggregate company stats
    const totalCompanies = await prisma.company.count();
    const activeCompanies = await prisma.company.count({
      where: { isActive: true }
    });

    // Aggregate bounty stats
    const totalBounties = await prisma.bounty.count();
    const activeBounties = await prisma.bounty.count({
      where: { status: 'ACTIVE' }
    });

    // Aggregate submission stats
    const totalSubmissions = await prisma.submission.count();
    const approvedSubmissions = await prisma.submission.count({
      where: { status: 'APPROVED' }
    });

    // Aggregate payment stats
    const totalVolume = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' }
    });

    const platformStats = {
      totalUsers,
      activeUsers,
      totalCompanies,
      activeCompanies,
      totalBounties,
      activeBounties,
      totalSubmissions,
      approvedSubmissions,
      totalVolume: totalVolume._sum.amount || 0,
      // Add platform health metrics if available
      platformHealth: {
        databaseStatus: 'operational', // Placeholder
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(platformStats);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
