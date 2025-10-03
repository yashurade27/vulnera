import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { type RouteParams } from '@/lib/next';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ submissionId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { submissionId } = await params;

    // First, get the submission to check permissions
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: { id: true },
        },
        company: {
          select: { id: true },
        },
        bounty: {
          select: {
            id: true,
            company: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions: submission author, company members, or admin can view reports
    const isSubmissionAuthor = submission.user.id === session.user.id;
    const isCompanyMember = await prisma.companyMember.findFirst({
      where: {
        companyId: submission.companyId,
        userId: session.user.id,
        isActive: true,
      },
    });
    const isAdmin = session.user.role === 'ADMIN';

    if (!isSubmissionAuthor && !isCompanyMember && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all reports for this submission
    const reports = await prisma.report.findMany({
      where: { submissionId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        reportedCompany: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('Get submission reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
