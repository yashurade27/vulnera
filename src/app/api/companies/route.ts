import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createCompanySchema, getCompaniesQuerySchema, type CreateCompanyInput } from '@/lib/types';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only COMPANY_ADMIN and ADMIN can create companies
    if (!['COMPANY_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only company admins can create companies' },
        { status: 403 }
      );
    }

    const body: CreateCompanyInput = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

  const { name, description, website, walletAddress, industry, companySize, location, logoUrl } = parsed.data;

    // Check if wallet address is already used
    const existingCompany = await prisma.company.findUnique({
      where: { walletAddress }
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Wallet address already associated with another company' },
        { status: 409 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug is unique
    const existingSlug = await prisma.company.findUnique({
      where: { slug }
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Company name already exists, please choose a different name' },
        { status: 409 }
      );
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        slug,
  description,
  website,
  walletAddress,
  industry,
  companySize,
  location,
  logoUrl,
        isVerified: false, // New companies start unverified
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        website: true,
        logoUrl: true,
        walletAddress: true,
        industry: true,
        companySize: true,
        location: true,
        isVerified: true,
        isActive: true,
        totalBountiesFunded: true,
        totalBountiesPaid: true,
        activeBounties: true,
        resolvedVulnerabilities: true,
        reputation: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create company member entry for the creator
    await prisma.companyMember.create({
      data: {
        userId: session.user.id,
        companyId: company.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        isActive: true,
      },
    });

    return NextResponse.json(
      { company, message: 'Company created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters - let the schema handle validation and transformation
    const query: { [key: string]: string | undefined } = {};
    if (searchParams.get('search')) query.search = searchParams.get('search')!;
    if (searchParams.get('verified')) query.verified = searchParams.get('verified')!;
    if (searchParams.get('active')) query.active = searchParams.get('active')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;

    const parsed = getCompaniesQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { search, verified, active, limit = 20, offset = 0 } = parsed.data;

    // Build where clause
    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
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
          isActive: true,
          totalBountiesFunded: true,
          totalBountiesPaid: true,
          activeBounties: true,
          resolvedVulnerabilities: true,
          reputation: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bounties: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      companies,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
