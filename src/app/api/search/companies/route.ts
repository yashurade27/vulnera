import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { searchCompaniesQuerySchema } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: { [key: string]: string | undefined } = {};
    if (searchParams.get('q')) query.q = searchParams.get('q')!;
    if (searchParams.get('industry')) query.industry = searchParams.get('industry')!;
    if (searchParams.get('verified')) query.verified = searchParams.get('verified')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;
    if (searchParams.get('sortBy')) query.sortBy = searchParams.get('sortBy')!;
    if (searchParams.get('sortOrder')) query.sortOrder = searchParams.get('sortOrder')!;

    const parsed = searchCompaniesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      q,
      industry,
      verified,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = parsed.data;

    // Build where clause
    const where: Prisma.CompanyWhereInput = {
      isActive: true, // Only show active companies
    };

    // Industry filter
    if (industry) {
      where.industry = {
        contains: industry,
        mode: 'insensitive'
      };
    }

    // Verified filter
    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    // Text search
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { industry: { contains: q, mode: 'insensitive' } },
        { companySize: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Get companies with pagination
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          website: true,
          logoUrl: true,
          industry: true,
          companySize: true,
          location: true,
          isVerified: true,
          totalBountiesFunded: true,
          totalBountiesPaid: true,
          activeBounties: true,
          resolvedVulnerabilities: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bounties: true,
              members: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.company.count({ where }),
    ]);

    const formattedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      website: company.website,
      logoUrl: company.logoUrl,
      industry: company.industry,
      companySize: company.companySize,
      location: company.location,
      isVerified: company.isVerified,
      totalBountiesFunded: company.totalBountiesFunded,
      totalBountiesPaid: company.totalBountiesPaid,
      activeBounties: company.activeBounties,
      resolvedVulnerabilities: company.resolvedVulnerabilities,
      totalBounties: company._count.bounties,
      totalMembers: company._count.members,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }));

    return NextResponse.json({
      companies: formattedCompanies,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        q,
        industry,
        verified,
        sortBy,
        sortOrder,
      },
    });

  } catch (error) {
    console.error('Search companies error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
