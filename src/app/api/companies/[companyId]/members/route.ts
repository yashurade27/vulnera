import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { inviteMemberSchema, getMembersQuerySchema, type InviteMemberInput, type GetMembersQuery } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { companyId } = params;

    // Check if user has permission to manage members
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
          { error: 'Forbidden - You do not have permission to manage company members' },
          { status: 403 }
        );
      }
    }

    const body: InviteMemberInput = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { userId, role, canCreateBounty, canReviewBounty, canApprovePayment, canManageMembers } = parsed.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this company' },
        { status: 409 }
      );
    }

    // Create member
    const newMember = await prisma.companyMember.create({
      data: {
        userId,
        companyId,
        role,
        canCreateBounty,
        canReviewBounty,
        canApprovePayment,
        canManageMembers,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      { member: newMember, message: 'Member added successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters - let the schema handle validation and transformation
    const query: any = {};
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;

    const parsed = getMembersQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { limit = 20, offset = 0 } = parsed.data;

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

    // Get members with pagination
    const [members, total] = await Promise.all([
      prisma.companyMember.findMany({
        where: { companyId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.companyMember.count({
        where: { companyId, isActive: true },
      }),
    ]);

    return NextResponse.json({
      members,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Get company members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
