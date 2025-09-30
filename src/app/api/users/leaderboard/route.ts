import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '10');
    const timeframe = searchParams.get('timeframe') || 'all';

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    let where: any = {
      status: 'ACTIVE',
      role: 'BOUNTY_HUNTER', // Only bounty hunters in leaderboard
    };

    // Apply timeframe filter
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid timeframe. Use: all, week, month, year' },
            { status: 400 }
          );
      }

      where.createdAt = {
        gte: startDate,
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        country: true,
        totalEarnings: true,
        totalBounties: true,
        reputation: true,
        rank: true,
        createdAt: true,
      },
      orderBy: { reputation: 'desc' },
      take: limit,
    });

    return NextResponse.json({ leaderboard: users });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}