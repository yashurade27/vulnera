import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createBountySchema, getBountiesQuerySchema, type CreateBountyInput, type GetBountiesQuery } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: any = {};
    if (searchParams.get('status')) query.status = searchParams.get('status')!;
    if (searchParams.get('type')) query.type = searchParams.get('type')!;
    if (searchParams.get('companyId')) query.companyId = searchParams.get('companyId')!;
    if (searchParams.get('search')) query.search = searchParams.get('search')!;
    if (searchParams.get('minReward')) query.minReward = searchParams.get('minReward')!;
    if (searchParams.get('maxReward')) query.maxReward = searchParams.get('maxReward')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;
    if (searchParams.get('sortBy')) query.sortBy = searchParams.get('sortBy')!;
    if (searchParams.get('sortOrder')) query.sortOrder = searchParams.get('sortOrder')!;

    const parsed = getBountiesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
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
      sortOrder = 'desc'
    } = parsed.data;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.bountyType = type;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (minReward !== undefined || maxReward !== undefined) {
      where.rewardAmount = {};
      if (minReward !== undefined) {
        where.rewardAmount.gte = minReward;
      }
      if (maxReward !== undefined) {
        where.rewardAmount.lte = maxReward;
      }
    }

    // Only show active bounties by default unless status is specified
    if (!status) {
      where.status = 'ACTIVE';
    }

    // Get bounties with pagination
    const [bounties, total] = await Promise.all([
      prisma.bounty.findMany({
        where,
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
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.bounty.count({ where }),
    ]);

    return NextResponse.json({
      bounties,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Get bounties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateBountyInput = await request.json();
    const parsed = createBountySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      companyId,
      title,
      description,
      bountyType,
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
    } = parsed.data;

    // Check if user is a member of the company and has permission to create bounties
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId,
        isActive: true,
        canCreateBounty: true,
      },
    });

    if (!companyMember) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to create bounties for this company' },
        { status: 403 }
      );
    }

    // Check if company exists and is active
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.isActive) {
      return NextResponse.json(
        { error: 'Company not found or inactive' },
        { status: 404 }
      );
    }

    // Validate dates
    const now = new Date();
    if (startsAt && startsAt <= now) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      );
    }

    if (endsAt && startsAt && endsAt <= startsAt) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create bounty
    const bounty = await prisma.bounty.create({
      data: {
        companyId,
        title,
        description,
        bountyType,
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
        status: startsAt ? 'ACTIVE' : 'ACTIVE', // Could be scheduled if startsAt is set
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
    });

    // Update company's active bounties count
    await prisma.company.update({
      where: { id: companyId },
      data: {
        activeBounties: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(
      { bounty, message: 'Bounty created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create bounty error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
