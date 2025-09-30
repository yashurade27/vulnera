import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const bountyTypeStats = await prisma.bounty.groupBy({
      by: ['bountyType'],
      _count: {
        id: true,
      },
      _sum: {
        rewardAmount: true,
      },
      where: {
        status: 'ACTIVE',
      },
    });

    const formattedStats = bountyTypeStats.map(stat => ({
      type: stat.bountyType,
      count: stat._count.id,
      totalReward: stat._sum.rewardAmount || 0,
    }));

    return NextResponse.json({
      bountyTypes: formattedStats,
    });
  } catch (error) {
    console.error('Error fetching bounty type stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
