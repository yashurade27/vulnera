import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { globalSearchQuerySchema, type GlobalSearchQuery } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: any = {};
    if (searchParams.get('q')) query.q = searchParams.get('q')!;
    if (searchParams.get('type')) query.type = searchParams.get('type')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;

    const parsed = globalSearchQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { q, type, limit = 20 } = parsed.data;

    const searchTerm = q.toLowerCase();
    const results: any = {};

    // Search bounties if type is not specified or includes bounties
    if (!type || type === 'bounties') {
      const bounties = await prisma.bounty.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { requirements: { contains: searchTerm, mode: 'insensitive' } },
            { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
          ],
          status: 'ACTIVE', // Only show active bounties in global search
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
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      results.bounties = bounties.map(bounty => ({
        id: bounty.id,
        title: bounty.title,
        description: bounty.description.substring(0, 200) + (bounty.description.length > 200 ? '...' : ''),
        bountyType: bounty.bountyType,
        rewardAmount: bounty.rewardAmount,
        company: bounty.company,
        submissionsCount: bounty._count.submissions,
        createdAt: bounty.createdAt,
        endsAt: bounty.endsAt,
      }));
    }

    // Search companies if type is not specified or includes companies
    if (!type || type === 'companies') {
      const companies = await prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { industry: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          industry: true,
          companySize: true,
          isVerified: true,
          totalBountiesFunded: true,
          activeBounties: true,
          resolvedVulnerabilities: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      results.companies = companies.map(company => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description?.substring(0, 200) + (company.description && company.description.length > 200 ? '...' : ''),
        logoUrl: company.logoUrl,
        industry: company.industry,
        companySize: company.companySize,
        isVerified: company.isVerified,
        totalBountiesFunded: company.totalBountiesFunded,
        activeBounties: company.activeBounties,
        resolvedVulnerabilities: company.resolvedVulnerabilities,
        createdAt: company.createdAt,
      }));
    }

    // Search users if type is not specified or includes users
    if (!type || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { fullName: { contains: searchTerm, mode: 'insensitive' } },
            { bio: { contains: searchTerm, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
          role: { in: ['BOUNTY_HUNTER', 'COMPANY_ADMIN'] }, // Only show hunters and company admins
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          bio: true,
          avatarUrl: true,
          country: true,
          role: true,
          totalEarnings: true,
          totalBounties: true,
          reputation: true,
          rank: true,
          createdAt: true,
        },
        orderBy: { reputation: 'desc' },
        take: limit,
      });

      results.users = users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio?.substring(0, 200) + (user.bio && user.bio.length > 200 ? '...' : ''),
        avatarUrl: user.avatarUrl,
        country: user.country,
        role: user.role,
        totalEarnings: user.totalEarnings,
        totalBounties: user.totalBounties,
        reputation: user.reputation,
        rank: user.rank,
        createdAt: user.createdAt,
      }));
    }

    return NextResponse.json({
      query: q,
      type: type || 'all',
      results,
      total: {
        bounties: results.bounties?.length || 0,
        companies: results.companies?.length || 0,
        users: results.users?.length || 0,
      },
    });

  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
