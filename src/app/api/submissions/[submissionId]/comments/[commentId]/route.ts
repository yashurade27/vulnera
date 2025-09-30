import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { updateCommentSchema } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Find the comment and check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      select: {
        id: true,
        userId: true,
        submissionId: true,
        content: true,
        isInternal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Verify the comment belongs to the submission
    if (comment.submissionId !== params.submissionId) {
      return NextResponse.json({ error: 'Comment does not belong to this submission' }, { status: 400 });
    }

    // Only the author can update their comment
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only update your own comments' }, { status: 403 });
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: params.commentId },
      data: {
        content: validatedData.content,
        updatedAt: new Date(),
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

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { submissionId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the comment and check ownership/permissions
    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      select: {
        id: true,
        userId: true,
        submissionId: true,
        isInternal: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Verify the comment belongs to the submission
    if (comment.submissionId !== params.submissionId) {
      return NextResponse.json({ error: 'Comment does not belong to this submission' }, { status: 400 });
    }

    // Check if user can delete this comment
    const isAuthor = comment.userId === session.user.id;

    let canDelete = isAuthor;

    // If not the author, check if user is a company admin for this submission
    if (!canDelete) {
      const submission = await prisma.submission.findUnique({
        where: { id: params.submissionId },
        select: { companyId: true },
      });

      if (submission) {
        const companyMember = await prisma.companyMember.findFirst({
          where: {
            companyId: submission.companyId,
            userId: session.user.id,
            isActive: true,
          },
        });
        canDelete = !!companyMember;
      }
    }

    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this comment' }, { status: 403 });
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: params.commentId },
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
