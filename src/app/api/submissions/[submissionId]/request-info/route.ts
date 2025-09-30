import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { requestInfoSchema, type RequestInfoInput } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { submissionId } = params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: true,
        user: true,
        company: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role !== 'ADMIN') {
      if (session.user.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const membership = await prisma.companyMember.findFirst({
        where: {
          userId: session.user.id,
          companyId: submission.companyId,
          isActive: true,
          canReviewBounty: true,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'You do not have permission to request information for this company' },
          { status: 403 }
        );
      }
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Submission must be pending to request more information' },
        { status: 400 }
      );
    }

    const body: RequestInfoInput = await request.json();
    const parsed = requestInfoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { message } = parsed.data;

    // Update submission status
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'NEEDS_MORE_INFO',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNotes: message,
      },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: 'More information requested',
        message: `More information is needed for your submission "${submission.title}": ${message}`,
        type: 'SUBMISSION',
        actionUrl: `/submissions/${submissionId}`,
      },
    });

    return NextResponse.json({ submission: updatedSubmission });

  } catch (error) {
    console.error('Request info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
