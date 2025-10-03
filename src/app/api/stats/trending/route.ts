import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'submissions'; // submissions, created, reward

    let orderBy: any = { totalSubmissions: 'desc' };

    if (sortBy === 'created') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'reward') {
      orderBy = { rewardAmount: 'desc' };
    }

    const trendingBounties = await prisma.bounty.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        bountyType: true,
        rewardAmount: true,
        totalSubmissions: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    return NextResponse.json({
      trendingBounties,
      sortBy,
      limit,
    });
  } catch (error) {
    console.error('Error fetching trending bounties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
