import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { updateCompanySchema, type UpdateCompanyInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string }>
) {
  try {
    const { companyId } = await params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
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
        isVerified: true,
        isActive: true,
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
            submissions: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });

  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { companyId } = await params;

    // Check if user is a member of this company with appropriate permissions
    const member = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
    });

    if (!member || !member.isActive) {
      // Also allow admins
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to update this company' },
          { status: 403 }
        );
      }
    }

    const body: UpdateCompanyInput = await request.json();
    const parsed = updateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // If updating name, check/generate new slug
    const updateData: Prisma.CompanyUpdateInput = { ...parsed.data };
    if (parsed.data.name) {
      const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existingSlug = await prisma.company.findFirst({
        where: {
          slug,
          id: { not: companyId }
        }
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Company name already exists, please choose a different name' },
          { status: 409 }
        );
      }

      updateData.slug = slug;
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
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
        isVerified: true,
        isActive: true,
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
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json({ company: updatedCompany });

  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { companyId } = await params;

    // Check if user is a member of this company with appropriate permissions
    const member = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
    });

    if (!member || !member.canManageMembers) {
      // Also allow admins
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to delete this company' },
          { status: 403 }
        );
      }
    }

    // Soft delete - mark as inactive
    await prisma.company.update({
      where: { id: companyId },
      data: { isActive: false },
    });

    // Also deactivate all company members
    await prisma.companyMember.updateMany({
      where: { companyId },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: 'Company deactivated successfully' }
    );

  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
