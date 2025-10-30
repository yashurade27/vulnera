import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createBountySchema, getBountiesQuerySchema, type CreateBountyInput } from '@/lib/types'
import { solanaService } from '@/lib/solana'

type SerializableBounty = Prisma.BountyGetPayload<{
  include: {
    company: {
      select: {
        id: true
        name: true
        slug: true
        logoUrl: true
        isVerified: true
        walletAddress: true
      }
    }
    _count: { select: { submissions: true } }
  }
}>

function serializeBounty(bounty: SerializableBounty) {
  return {
    ...bounty,
    rewardAmount: Number(bounty.rewardAmount),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const query: { [key: string]: string | undefined } = {}
    if (searchParams.get('status')) query.status = searchParams.get('status')!
    if (searchParams.get('type')) query.type = searchParams.get('type')!
    if (searchParams.get('companyId')) query.companyId = searchParams.get('companyId')!
    if (searchParams.get('search')) query.search = searchParams.get('search')!
    if (searchParams.get('minReward')) query.minReward = searchParams.get('minReward')!
    if (searchParams.get('maxReward')) query.maxReward = searchParams.get('maxReward')!
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!
    if (searchParams.get('sortBy')) query.sortBy = searchParams.get('sortBy')!
    if (searchParams.get('sortOrder')) query.sortOrder = searchParams.get('sortOrder')!

    const parsed = getBountiesQuerySchema.safeParse(query)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.issues }, { status: 400 })
    }

    const {
      status,
      type,
      companyId,
      search,
      minReward,
      maxReward,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = parsed.data

    // Build where clause
    const where: Prisma.BountyWhereInput = {}

    if (status) {
      where.status = status
    }

    if (type) {
      where.bountyTypes = { has: type }
    }

    if (companyId) {
      where.companyId = companyId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (minReward !== undefined || maxReward !== undefined) {
      where.rewardAmount = {}
      if (minReward !== undefined) {
        where.rewardAmount.gte = minReward
      }
      if (maxReward !== undefined) {
        where.rewardAmount.lte = maxReward
      }
    }

    // Only show active bounties by default unless status is specified
    if (!status) {
      where.status = 'ACTIVE'
    }

    // Get bounties with pagination
    const fundedWhere: Prisma.BountyWhereInput = {
      ...where,
      escrowAddress: { not: null },
      txSignature: { not: null },
    }

    const [bounties, totalCandidates] = await Promise.all([
      prisma.bounty.findMany({
        where: fundedWhere,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              isVerified: true,
              walletAddress: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.bounty.findMany({
        where: fundedWhere,
        select: {
          id: true,
          escrowAddress: true,
        },
      }),
    ])

    const escrowCache = new Map<string, number>()

    const enriched = await Promise.all(
      bounties.map(async (bounty) => {
        const serialized = serializeBounty(bounty)
        let escrowBalanceLamports: number | null = null
        if (serialized.escrowAddress) {
          if (escrowCache.has(serialized.escrowAddress)) {
            escrowBalanceLamports = escrowCache.get(serialized.escrowAddress) ?? 0
          } else {
            const escrowData = await solanaService.getEscrowData(serialized.escrowAddress)
            escrowBalanceLamports = escrowData?.escrowAmount ?? 0
            escrowCache.set(serialized.escrowAddress, escrowBalanceLamports)
          }
        }
        return {
          ...serialized,
          escrowBalanceLamports,
        }
      }),
    )

    const fundedBounties = enriched.filter(
      (bounty) => bounty.escrowAddress && bounty.escrowBalanceLamports && bounty.escrowBalanceLamports > 0,
    )

    let total = 0
    for (const candidate of totalCandidates) {
      if (!candidate.escrowAddress) {
        continue
      }
      let escrowAmount = escrowCache.get(candidate.escrowAddress)
      if (escrowAmount === undefined) {
        const escrowData = await solanaService.getEscrowData(candidate.escrowAddress)
        escrowAmount = escrowData?.escrowAmount ?? 0
        escrowCache.set(candidate.escrowAddress, escrowAmount)
      }
      if (escrowAmount && escrowAmount > 0) {
        total += 1
      }
    }

    return NextResponse.json({
      bounties: fundedBounties,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Get bounties error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateBountyInput = await request.json()
    const parsed = createBountySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const {
      companyId,
      title,
      description,
      bountyTypes,
      targetUrl,
      rewardAmount,
      maxSubmissions,
      inScope,
      outOfScope,
      requirements,
      guidelines,
      startsAt,
      endsAt,
      responseDeadline,
    } = parsed.data

    // Check if user is a member of the company and has permission to create bounties
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId,
        isActive: true,
        canCreateBounty: true,
      },
    })

    if (!companyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to create bounties for this company' },
        { status: 403 },
      )
    }

    // Check if company exists and is active
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company || !company.isActive) {
      return NextResponse.json({ error: 'Company not found or inactive' }, { status: 404 })
    }

    // Validate dates
    const now = new Date()
    const todayIsoDate = now.toISOString().split('T')[0]

    let normalizedStartDate: Date | undefined
    let normalizedStartIso: string | undefined

    if (startsAt) {
      normalizedStartDate = startsAt
      normalizedStartIso = normalizedStartDate.toISOString().split('T')[0]

      if (normalizedStartIso < todayIsoDate) {
        return NextResponse.json({ error: 'Start date cannot be before today' }, { status: 400 })
      }
    }

    if (endsAt && normalizedStartIso) {
      const normalizedEndIso = endsAt.toISOString().split('T')[0]
      if (normalizedEndIso < normalizedStartIso) {
        return NextResponse.json({ error: 'End date cannot be before the start date' }, { status: 400 })
      }
    }

    // Check if company already has an ACTIVE bounty
    const existingActiveBounty = await prisma.bounty.count({
      where: {
        companyId,
        status: 'ACTIVE',
      },
    })

    if (existingActiveBounty > 0) {
      return NextResponse.json(
        { error: 'A bounty already exists for this company. Multiple bounties per company are not supported.' },
        { status: 400 },
      )
    }

    // Delete any existing DRAFT bounties for this company before creating a new one
    await prisma.bounty.deleteMany({
      where: {
        companyId,
        status: 'DRAFT',
      },
    })

    // Create bounty
    const bounty = await prisma.bounty.create({
      data: {
        companyId,
        title,
        description,
  bountyTypes,
        targetUrl,
        rewardAmount,
        maxSubmissions,
        inScope,
        outOfScope,
        requirements,
        guidelines,
        startsAt,
        endsAt,
        responseDeadline,
        status: 'DRAFT', // Will be set to ACTIVE when funded
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    return NextResponse.json({ bounty, message: 'Bounty created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Create bounty error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
