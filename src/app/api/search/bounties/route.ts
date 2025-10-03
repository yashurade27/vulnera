import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { searchBountiesQuerySchema } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: { [key: string]: string | undefined } = {};
    if (searchParams.get('q')) query.q = searchParams.get('q')!;
    if (searchParams.get('type')) query.type = searchParams.get('type')!;
    if (searchParams.get('minReward')) query.minReward = searchParams.get('minReward')!;
    if (searchParams.get('maxReward')) query.maxReward = searchParams.get('maxReward')!;
    if (searchParams.get('companyId')) query.companyId = searchParams.get('companyId')!;
    if (searchParams.get('status')) query.status = searchParams.get('status')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;
    if (searchParams.get('sortBy')) query.sortBy = searchParams.get('sortBy')!;
    if (searchParams.get('sortOrder')) query.sortOrder = searchParams.get('sortOrder')!;

    const parsed = searchBountiesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      q,
      type,
      minReward,
      maxReward,
      companyId,
      status = 'ACTIVE',
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = parsed.data;

    // Build where clause
    const where: Prisma.BountyWhereInput = {};

    // Status filter
    where.status = status;

    // Bounty type filter
    if (type) {
      where.bountyType = type;
    }

    // Company filter
    if (companyId) {
      where.companyId = companyId;
    }

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { requirements: { contains: q, mode: 'insensitive' } },
        { guidelines: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Reward range filter
    if (minReward !== undefined || maxReward !== undefined) {
      where.rewardAmount = {};
      if (minReward !== undefined) {
        where.rewardAmount.gte = minReward;
      }
      if (maxReward !== undefined) {
        where.rewardAmount.lte = maxReward;
      }
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
              industry: true,
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

    const formattedBounties = bounties.map(bounty => ({
      id: bounty.id,
      title: bounty.title,
      description: bounty.description,
      bountyType: bounty.bountyType,
      targetUrl: bounty.targetUrl,
      rewardAmount: bounty.rewardAmount,
      maxSubmissions: bounty.maxSubmissions,
      inScope: bounty.inScope,
      outOfScope: bounty.outOfScope,
      requirements: bounty.requirements,
      guidelines: bounty.guidelines,
      startsAt: bounty.startsAt,
      endsAt: bounty.endsAt,
      responseDeadline: bounty.responseDeadline,
      totalSubmissions: bounty.totalSubmissions,
      validSubmissions: bounty.validSubmissions,
      paidOut: bounty.paidOut,
      company: bounty.company,
      submissionsCount: bounty._count.submissions,
      createdAt: bounty.createdAt,
      updatedAt: bounty.updatedAt,
      publishedAt: bounty.publishedAt,
    }));

    return NextResponse.json({
      bounties: formattedBounties,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        q,
        type,
        minReward,
        maxReward,
        companyId,
        status,
        sortBy,
        sortOrder,
      },
    });

  } catch (error) {
    console.error('Search bounties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
