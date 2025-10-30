import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { createCommentSchema, getCommentsQuerySchema } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ submissionId: string }>
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      includeInternal: searchParams.get('includeInternal') || undefined,
    };

    const validatedQuery = getCommentsQuerySchema.parse(queryParams);
    const includeInternal = validatedQuery.includeInternal === 'true';

    // Check if user can access this submission
    const { submissionId } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, userId: true, companyId: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if user is the submitter or a company member
    const isSubmitter = submission.userId === session.user.id;
    const isCompanyMember = await prisma.companyMember.findFirst({
      where: {
        companyId: submission.companyId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!isSubmitter && !isCompanyMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build where clause for comments
  const whereClause: any = { submissionId };

    // If not a company member, only show public comments
    if (!isCompanyMember) {
      whereClause.isInternal = false;
    } else if (!includeInternal) {
      // Company members see all by default, but can filter to public only
      // No additional filter needed
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams<{ submissionId: string }>
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Check if submission exists and user can access it
    const { submissionId } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, userId: true, companyId: true, status: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if user is the submitter or a company member
    const isSubmitter = submission.userId === session.user.id;
    const isCompanyMember = await prisma.companyMember.findFirst({
      where: {
        companyId: submission.companyId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!isSubmitter && !isCompanyMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Company members can make internal comments, submitters can only make public comments
    if (validatedData.isInternal && !isCompanyMember) {
      return NextResponse.json({ error: 'Only company members can create internal comments' }, { status: 403 });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        submissionId,
        userId: session.user.id,
        content: validatedData.content,
        isInternal: validatedData.isInternal,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Create notification for the other party
    if (isSubmitter && isCompanyMember) {
      // Submitter commented, notify company
      await prisma.notification.create({
        data: {
          userId: submission.companyId, // This should be the company admin, but we need to handle this differently
          title: 'New comment on submission',
          message: `${session.user.username} commented on submission: ${submission.id}`,
          type: 'SUBMISSION',
          actionUrl: `/submissions/${submissionId}`,
        },
      });
    } else if (isCompanyMember && !isSubmitter) {
      // Company commented, notify submitter
      await prisma.notification.create({
        data: {
          userId: submission.userId,
          title: 'New comment on your submission',
          message: `Company commented on your submission: ${submission.id}`,
          type: 'SUBMISSION',
          actionUrl: `/submissions/${submissionId}`,
        },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
