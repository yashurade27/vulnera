import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalEarnings: true,
        totalBounties: true,
        reputation: true,
        rank: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate additional stats
    const submissions = await prisma.submission.findMany({
      where: { userId, status: 'APPROVED' },
      select: { rewardAmount: true },
    })

    const approvedSubmissions = submissions.length
    const averageReward =
      approvedSubmissions > 0
        ? submissions.reduce((sum, sub) => sum + Number(sub.rewardAmount || 0), 0) / approvedSubmissions
        : 0

    const stats = {
      totalEarnings: Number(user.totalEarnings),
      totalBounties: user.totalBounties,
      reputation: user.reputation,
      rank: user.rank,
      approvedSubmissions,
      averageReward,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
