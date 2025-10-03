import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const activeBounties = await prisma.bounty.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        bountyTypes: true,
        rewardAmount: true,
      },
    });

    const aggregates = new Map<string, { count: number; totalReward: number }>();

    for (const bounty of activeBounties) {
      const reward = bounty.rewardAmount ? Number(bounty.rewardAmount) : 0;
      const types = Array.isArray(bounty.bountyTypes) && bounty.bountyTypes.length
        ? bounty.bountyTypes
        : ['UNSPECIFIED'];
      for (const type of types) {
        const key = type ?? 'UNSPECIFIED';
        const current = aggregates.get(key) ?? { count: 0, totalReward: 0 };
        current.count += 1;
        current.totalReward += reward;
        aggregates.set(key, current);
      }
    }

    const formattedStats = Array.from(aggregates.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      totalReward: data.totalReward,
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
