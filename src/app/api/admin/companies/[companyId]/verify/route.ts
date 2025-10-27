import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { type RouteParams } from '@/lib/next';

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string }>
) {
  try {
    // Get session and check admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

  const { companyId } = await params;

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.isVerified) {
      return NextResponse.json(
        { error: 'Company is already verified' },
        { status: 400 }
      );
    }

    // Verify the company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { isVerified: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        website: true,
        logoUrl: true,
        walletAddress: true,
        smartContractAddress: true,
        industry: true,
        companySize: true,
        location: true,
        totalBountiesFunded: true,
        totalBountiesPaid: true,
        activeBounties: true,
        resolvedVulnerabilities: true,
        reputation: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ company: updatedCompany });

  } catch (error) {
    console.error('Verify company error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
