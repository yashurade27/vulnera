import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateMemberSchema, type UpdateMemberInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string; memberId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { companyId, memberId } = await params;

    // Check if user has permission to manage members
    const requesterMember = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
    });

    if (!requesterMember || !requesterMember.canManageMembers) {
      // Also allow admins
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to manage company members' },
          { status: 403 }
        );
      }
    }

    const body: UpdateMemberInput = await request.json();
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Check if member exists
    const member = await prisma.companyMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!member || member.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent users from modifying their own permissions
    if (member.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot modify your own member permissions' },
        { status: 403 }
      );
    }

    // Update member
    const updatedMember = await prisma.companyMember.update({
      where: { id: memberId },
      data: parsed.data,
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
    });

    return NextResponse.json({ member: updatedMember });

  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string; memberId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { companyId, memberId } = await params;

    // Check if user has permission to manage members
    const requesterMember = await prisma.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId,
        },
      },
    });

    if (!requesterMember || !requesterMember.canManageMembers) {
      // Also allow admins
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to manage company members' },
          { status: 403 }
        );
      }
    }

    // Check if member exists
    const member = await prisma.companyMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!member || member.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent users from removing themselves
    if (member.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the company' },
        { status: 403 }
      );
    }

    // Soft delete - mark as inactive
    await prisma.companyMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: 'Member removed successfully' }
    );

  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
