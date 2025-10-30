import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCompanyBountiesQuerySchema } from '@/lib/types';
import { type RouteParams } from '@/lib/next';
import { solanaService } from '@/lib/solana';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string }>
) {
  try {
    const { companyId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters - let the schema handle validation and transformation
    const query: { [key: string]: string | undefined } = {};
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
    const where: Prisma.BountyWhereInput = { companyId };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.bountyTypes = { has: type };
    }

    // Get bounties with pagination
    // If status is DRAFT, return bounties without escrow OR with escrow but no balance
    // Otherwise return funded bounties with balance
    let queryWhere: Prisma.BountyWhereInput = where;
    
    if (status === 'DRAFT') {
      // For drafts: either no escrow at all, or escrow exists but we'll check balance later
      queryWhere = where;
    } else if (status) {
      // For non-draft statuses, only return funded bounties
      queryWhere = {
        ...where,
        escrowAddress: { not: null },
        txSignature: { not: null },
      };
    }

    const [bounties, totalCandidates] = await Promise.all([
      prisma.bounty.findMany({
        where: queryWhere,
        select: {
          id: true,
          title: true,
          description: true,
          bountyTypes: true,
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
          escrowAddress: true,
          txSignature: true,
          maxSubmissions: true,
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
      prisma.bounty.findMany({
        where: queryWhere,
        select: {
          id: true,
          escrowAddress: true,
        },
      }),
    ]);

    const escrowCache = new Map<string, number>();

    const enriched = await Promise.all(
      bounties.map(async (bounty) => {
        let escrowBalanceLamports: number | null = null;
        if (bounty.escrowAddress) {
          if (escrowCache.has(bounty.escrowAddress)) {
            escrowBalanceLamports = escrowCache.get(bounty.escrowAddress) ?? 0;
          } else {
            const escrowData = await solanaService.getEscrowData(bounty.escrowAddress);
            escrowBalanceLamports = escrowData?.escrowAmount ?? 0;
            escrowCache.set(bounty.escrowAddress, escrowBalanceLamports);
          }
        }

        return {
          ...bounty,
          rewardAmount: Number(bounty.rewardAmount),
          bountyTypes: Array.isArray(bounty.bountyTypes) && bounty.bountyTypes.length
            ? bounty.bountyTypes
            : ['SECURITY'],
          escrowBalanceLamports,
          maxSubmissions: bounty.maxSubmissions,
        };
      })
    );

    // For draft bounties, return only bounties without proper funding
    // For other statuses, filter by escrow balance
    const filteredBounties = status === 'DRAFT' 
      ? enriched.filter(
          (bounty) => !bounty.escrowAddress || !bounty.escrowBalanceLamports || bounty.escrowBalanceLamports === 0
        )
      : enriched.filter(
          (bounty) => bounty.escrowAddress && bounty.escrowBalanceLamports && bounty.escrowBalanceLamports > 0
        );

    let total = 0;
    for (const candidate of totalCandidates) {
      if (status === 'DRAFT') {
        // For draft bounties, only count unfunded ones
        if (!candidate.escrowAddress) {
          total += 1;
          continue;
        }
        let escrowAmount = escrowCache.get(candidate.escrowAddress);
        if (escrowAmount === undefined) {
          const escrowData = await solanaService.getEscrowData(candidate.escrowAddress);
          escrowAmount = escrowData?.escrowAmount ?? 0;
          escrowCache.set(candidate.escrowAddress, escrowAmount);
        }
        // Count as draft if no balance
        if (!escrowAmount || escrowAmount === 0) {
          total += 1;
        }
      } else {
        // For other statuses, only count funded bounties
        if (!candidate.escrowAddress) {
          continue;
        }
        let escrowAmount = escrowCache.get(candidate.escrowAddress);
        if (escrowAmount === undefined) {
          const escrowData = await solanaService.getEscrowData(candidate.escrowAddress);
          escrowAmount = escrowData?.escrowAmount ?? 0;
          escrowCache.set(candidate.escrowAddress, escrowAmount);
        }
        if (escrowAmount && escrowAmount > 0) {
          total += 1;
        }
      }
    }

    return NextResponse.json({
      bounties: filteredBounties,
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
