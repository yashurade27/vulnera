import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyPaymentSchema, type VerifyPaymentInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function POST(
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

    // Check permissions: only company members with payment approval permission or admins can verify
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
        { error: 'Forbidden - You do not have permission to verify this payment' },
        { status: 403 }
      );
    }

    const body: VerifyPaymentInput = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { txSignature: _, confirmations } = parsed.data;

    // Update payment with verification details
    const updateData: Prisma.PaymentUpdateInput = {
      confirmations,
      blockchainConfirmed: confirmations >= 1, // Assuming 1 confirmation is sufficient
    };

    // If confirmed and status is PENDING, update to COMPLETED
    if (updateData.blockchainConfirmed && payment.status === 'PENDING') {
      updateData.status = 'COMPLETED';
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

    return NextResponse.json({
      payment: updatedPayment,
      message: 'Payment verification updated successfully'
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
