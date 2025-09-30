import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateSubmissionSchema, type UpdateSubmissionInput } from '@/lib/types';

export async function GET(
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
        bounty: {
          select: {
            id: true,
            title: true,
            description: true,
            rewardAmount: true,
            status: true,
            responseDeadline: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            reputation: true,
            totalEarnings: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            txSignature: true,
            completedAt: true,
          },
        },
        reports: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
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

    // Check permissions
    const canAccess = await checkSubmissionAccess(session.user.id, session.user.role, submission);

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ submission });

  } catch (error) {
    console.error('Get submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      include: { bounty: true },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Only the author can update, and only if status is PENDING
    if (submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the author can update this submission' },
        { status: 403 }
      );
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot update submission that has been reviewed' },
        { status: 400 }
      );
    }

    const body: UpdateSubmissionInput = await request.json();
    const parsed = updateSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: parsed.data,
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            rewardAmount: true,
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

    return NextResponse.json({ submission: updatedSubmission });

  } catch (error) {
    console.error('Update submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      include: { bounty: true },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Only the author can delete, and only if status is PENDING
    if (submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the author can delete this submission' },
        { status: 403 }
      );
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot delete submission that has been reviewed' },
        { status: 400 }
      );
    }

    await prisma.submission.delete({
      where: { id: submissionId },
    });

    // Update bounty stats
    await prisma.bounty.update({
      where: { id: submission.bountyId },
      data: {
        totalSubmissions: { decrement: 1 },
      },
    });

    return NextResponse.json({ message: 'Submission deleted successfully' });

  } catch (error) {
    console.error('Delete submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if user can access submission
async function checkSubmissionAccess(userId: string, userRole: string, submission: any): Promise<boolean> {
  if (userRole === 'ADMIN') return true;

  if (userRole === 'BOUNTY_HUNTER') {
    return submission.userId === userId;
  }

  if (userRole === 'COMPANY_ADMIN') {
    // Check if user is member of the company
    const membership = await prisma.companyMember.findFirst({
      where: {
        userId,
        companyId: submission.companyId,
        isActive: true,
      },
    });
    return !!membership;
  }

  return false;
}
