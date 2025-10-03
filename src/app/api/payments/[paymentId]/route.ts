import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updatePaymentSchema, type UpdatePaymentInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ paymentId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
        submission: {
          select: {
            id: true,
            title: true,
            bounty: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check permissions: user can view their own payments, company members can view company payments, admins can view all
    const hasAccess =
      session.user.id === payment.userId ||
      session.user.role === 'ADMIN' ||
      (await prisma.companyMember.findFirst({
        where: {
          userId: session.user.id,
          companyId: payment.companyId,
          isActive: true,
        },
      }));

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ payment });

  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ paymentId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        company: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check permissions: only company members with payment approval permission or admins can update
    const isCompanyAdmin = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: payment.companyId,
        isActive: true,
        canApprovePayment: true,
      },
    });

    if (session.user.role !== 'ADMIN' && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to update this payment' },
        { status: 403 }
      );
    }

    const body: UpdatePaymentInput = await request.json();
    const parsed = updatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updateData = parsed.data;

    // If status is being updated to COMPLETED, set completedAt
    if (updateData.status === 'COMPLETED' && payment.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
        submission: {
          select: {
            id: true,
            title: true,
            bounty: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ payment: updatedPayment });

  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
