import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Prisma, SubmissionStatus } from '@prisma/client'

const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DUPLICATE',
  'SPAM',
  'NEEDS_MORE_INFO',
]

const SORT_FIELDS = new Set(['submittedAt', 'status', 'rewardAmount'] as const)

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number => (value ? Number(value) : 0)

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    if (session.user.id !== userId && session.user.role !== 'ADMIN' && session.user.role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status') as SubmissionStatus | null
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const sortByParam = searchParams.get('sortBy')
    const sortOrderParam = searchParams.get('sortOrder')
    const searchTerm = searchParams.get('search')?.trim()
    const bountyId = searchParams.get('bountyId')
    const companyIdFilter = searchParams.get('companyId')

    const limit = Math.min(Math.max(Number(limitParam ?? '10'), 1), 100)
    const offset = Math.max(Number(offsetParam ?? '0'), 0)

    if (Number.isNaN(limit) || Number.isNaN(offset)) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 })
    }

    const fallbackSort = 'submittedAt'
    const sortCandidate = (sortByParam ?? fallbackSort) as string
    const sortBy = SORT_FIELDS.has(sortCandidate as 'submittedAt' | 'status' | 'rewardAmount')
      ? (sortCandidate as 'submittedAt' | 'status' | 'rewardAmount')
      : fallbackSort

    const sortOrder: Prisma.SortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc'

    if (statusParam && !SUBMISSION_STATUSES.includes(statusParam)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        reputation: true,
        totalBounties: true,
        totalEarnings: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let accessibleCompanyIds: string[] | null = null

    if (session.user.role === 'COMPANY_ADMIN') {
      const memberships = await prisma.companyMember.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { companyId: true },
      })

      accessibleCompanyIds = memberships.map((membership) => membership.companyId)

      if (accessibleCompanyIds.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const where: Prisma.SubmissionWhereInput = {
      userId,
    }

    if (statusParam) {
      where.status = statusParam
    }

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { bounty: { title: { contains: searchTerm, mode: 'insensitive' } } },
        { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ]
    }

    if (bountyId) {
      where.bountyId = bountyId
    }

    if (companyIdFilter) {
      where.companyId = companyIdFilter
    }

    if (accessibleCompanyIds) {
      const allowed = new Set(accessibleCompanyIds)

      if (typeof where.companyId === 'string' && !allowed.has(where.companyId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (!where.companyId) {
        where.companyId = { in: accessibleCompanyIds }
      }
    }

    let orderBy: Prisma.SubmissionOrderByWithRelationInput = { submittedAt: sortOrder }

    if (sortBy === 'status') {
      orderBy = { status: sortOrder }
    } else if (sortBy === 'rewardAmount') {
      orderBy = { rewardAmount: sortOrder }
    }

    type SubmissionWithRelations = Prisma.SubmissionGetPayload<{
      include: {
        bounty: {
          select: {
            id: true
            title: true
            rewardAmount: true
            bountyType: true
            status: true
          }
        }
        company: {
          select: {
            id: true
            name: true
          }
        }
        _count: {
          select: {
            comments: true
          }
        }
      }
    }>

    const [submissionsRaw, total, statusSummaryRaw, aggregates, topBountyGroups] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          bounty: {
            select: {
              id: true,
              title: true,
              rewardAmount: true,
              bountyType: true,
              status: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }) as Promise<SubmissionWithRelations[]>,
      prisma.submission.count({ where }),
      prisma.submission.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.submission.aggregate({
        where,
        _count: { _all: true },
        _sum: { rewardAmount: true },
        _max: { submittedAt: true },
      }),
      prisma.submission.groupBy({
        by: ['bountyId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 3,
      }),
    ])

    const statusBreakdown = SUBMISSION_STATUSES.reduce(
      (acc, status) => {
        acc[status] = 0
        return acc
      },
      {} as Record<SubmissionStatus, number>,
    )

    statusSummaryRaw.forEach((entry) => {
      statusBreakdown[entry.status as SubmissionStatus] = entry._count.status
    })

    const topBountyIds = topBountyGroups.map((group) => group.bountyId)

    const topBountyDetails = topBountyIds.length
      ? await prisma.bounty.findMany({
          where: { id: { in: topBountyIds } },
          select: {
            id: true,
            title: true,
            rewardAmount: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : []

    const topBountyMap = new Map(topBountyDetails.map((item) => [item.id, item]))

    const topBounties = topBountyGroups.map((group) => {
      const details = topBountyMap.get(group.bountyId)

      return {
        bountyId: group.bountyId,
        submissions: group._count?.id ?? 0,
        title: details?.title ?? 'Unknown bounty',
        rewardAmount: details?.rewardAmount ? Number(details.rewardAmount) : null,
        company: details?.company ?? null,
      }
    })

    const submissions = submissionsRaw.map((submission) => ({
      ...submission,
      rewardAmount: submission.rewardAmount ? Number(submission.rewardAmount) : null,
      bounty: submission.bounty
        ? {
            ...submission.bounty,
            rewardAmount: submission.bounty.rewardAmount ? Number(submission.bounty.rewardAmount) : null,
          }
        : null,
    }))

    const totalReward = decimalToNumber(aggregates._sum.rewardAmount)
    const latestSubmissionAt = aggregates._max.submittedAt ?? null

    const userPayload = {
      ...user,
      totalEarnings: decimalToNumber(user.totalEarnings as Prisma.Decimal | null | undefined),
    }

    return NextResponse.json({
      user: userPayload,
      submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        total,
        totalReward,
        latestSubmissionAt,
        statusBreakdown,
        topBounties,
      },
    })
  } catch (error) {
    console.error('Get user submissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
