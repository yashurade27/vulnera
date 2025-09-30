import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanyBountiesQuerySchema, type GetCompanyBountiesQuery } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters - let the schema handle validation and transformation
    const query: any = {};
    if (searchParams.get('status')) query.status = searchParams.get('status')!;
    if (searchParams.get('type')) query.type = searchParams.get('type')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;

    const parsed = getCompanyBountiesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status, type, limit = 20, offset = 0 } = parsed.data;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.bountyType = type;
    }

    // Get bounties with pagination
    const [bounties, total] = await Promise.all([
      prisma.bounty.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          bountyType: true,
          targetUrl: true,
          rewardAmount: true,
          status: true,
          inScope: true,
          outOfScope: true,
          requirements: true,
          guidelines: true,
          startsAt: true,
          endsAt: true,
          totalSubmissions: true,
          validSubmissions: true,
          paidOut: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          closedAt: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
    console.error('Get company bounties error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
