import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getBountySubmissionsQuerySchema, type GetBountySubmissionsQuery } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { bountyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bountyId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: any = {};
    if (searchParams.get('status')) query.status = searchParams.get('status')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;

    const parsed = getBountySubmissionsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status, limit = 20, offset = 0 } = parsed.data;

    // Check if bounty exists
    const existingBounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { company: true },
    });

    if (!existingBounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view submissions for this bounty
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: existingBounty.companyId,
        isActive: true,
      },
    });

    // Only company members or the submitter can view submissions
    const isCompanyMember = !!companyMember;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isCompanyMember && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to view submissions for this bounty' },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = {
      bountyId,
    };

    if (status) {
      where.status = status;
    }

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              reputation: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              completedAt: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Get bounty submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
