import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import {
  createSubmissionSchema,
  getSubmissionsQuerySchema,
  type CreateSubmissionInput,
} from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateSubmissionInput = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { bountyId, ...submissionData } = parsed.data;

    // Verify bounty exists and is active
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: { company: true },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      );
    }

    if (bounty.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Bounty is not active' },
        { status: 400 }
      );
    }

    // Check if bounty has ended
    if (bounty.endsAt && bounty.endsAt < new Date()) {
      return NextResponse.json(
        { error: 'Bounty has ended' },
        { status: 400 }
      );
    }
    // Check max submissions limit
    if (bounty.maxSubmissions) {
      const submissionCount = await prisma.submission.count({
        where: { bountyId },
      });

      if (submissionCount >= bounty.maxSubmissions) {
        return NextResponse.json(
          { error: 'Maximum submissions reached for this bounty' },
          { status: 400 }
        );
      }
    }

    // Calculate response deadline
    const responseDeadline = new Date();
    responseDeadline.setDate(responseDeadline.getDate() + bounty.responseDeadline);

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        ...submissionData,
        bountyId,
        userId: session.user.id,
        companyId: bounty.companyId,
        responseDeadline,
      },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            rewardAmount: true,
            responseDeadline: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update bounty stats
    await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        totalSubmissions: { increment: 1 },
      },
    });

    return NextResponse.json({ submission }, { status: 201 });

  } catch (error) {
    console.error('Create submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const parsed = getSubmissionsQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      bountyId,
      userId,
      companyId,
      status,
      limit = 20,
      offset = 0,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
    } = parsed.data;

    // Build where clause based on user role and permissions
    const where: any = {};

    if (bountyId) where.bountyId = bountyId;
    if (status) where.status = status;

    // Filter based on user permissions
    if (session.user.role === 'BOUNTY_HUNTER') {
      // Bounty hunters can only see their own submissions
      where.userId = session.user.id;
    } else if (session.user.role === 'COMPANY_ADMIN') {
      // Company admins can see submissions for their companies
      if (companyId) {
        // Check if user is member of the requested company
        const membership = await prisma.companyMember.findFirst({
          where: {
            userId: session.user.id,
            companyId,
            isActive: true,
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: 'Access denied to company submissions' },
            { status: 403 }
          );
        }

        where.companyId = companyId;
      } else {
        // Get submissions for all companies the user is member of
        const memberships = await prisma.companyMember.findMany({
          where: {
            userId: session.user.id,
            isActive: true,
          },
          select: { companyId: true },
        });

        const companyIds = memberships.map(m => m.companyId);
        where.companyId = { in: companyIds };
      }
    } else if (session.user.role === 'ADMIN') {
      // Admins can see all submissions, or filter by userId/companyId if provided
      if (userId) where.userId = userId;
      if (companyId) where.companyId = companyId;
    }

    // If userId is specified in query and user has permission, use it
    if (userId && (session.user.role === 'ADMIN' || session.user.id === userId)) {
      where.userId = userId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            rewardAmount: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            reputation: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.submission.count({ where });

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
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
