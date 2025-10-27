import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createPaymentSchema, getPaymentsQuerySchema, type CreatePaymentInput } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can view all payments
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: { [key: string]: string | undefined } = {};
    if (searchParams.get('userId')) query.userId = searchParams.get('userId')!;
    if (searchParams.get('companyId')) query.companyId = searchParams.get('companyId')!;
    if (searchParams.get('status')) query.status = searchParams.get('status')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;
    if (searchParams.get('sortBy')) query.sortBy = searchParams.get('sortBy')!;
    if (searchParams.get('sortOrder')) query.sortOrder = searchParams.get('sortOrder')!;

    const parsed = getPaymentsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      userId,
      companyId,
      status,
      limit = 20,
      offset = 0,
      sortBy = 'initiatedAt',
      sortOrder = 'desc'
    } = parsed.data;

    // Build where clause
    const where: Prisma.PaymentWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (status) {
      where.status = status;
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
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
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreatePaymentInput = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      submissionId,
      amount,
      platformFee = 0,
      txSignature,
      fromWallet,
      toWallet,
    } = parsed.data;

    // Check if submission exists and is approved
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: {
          include: {
            company: true,
          },
        },
        user: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Submission must be approved before payment can be created' },
        { status: 400 }
      );
    }

    // Check if user has permission (company admin or admin)
    const isCompanyAdmin = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: submission.companyId,
        isActive: true,
        canApprovePayment: true,
      },
    });

    if (session.user.role !== 'ADMIN' && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to create payments for this submission' },
        { status: 403 }
      );
    }

    // Check if payment already exists for this submission
    const existingPayment = await prisma.payment.findUnique({
      where: { submissionId },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already exists for this submission' },
        { status: 400 }
      );
    }

    // Calculate net amount
    const netAmount = amount - platformFee;

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        submissionId,
        userId: submission.userId,
        companyId: submission.companyId,
        amount,
        platformFee,
        netAmount,
        txSignature,
        fromWallet,
        toWallet,
        status: 'PENDING', // Will be updated when verified
      },
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

    // Update submission with payment ID
    await prisma.submission.update({
      where: { id: submissionId },
      data: { paymentId: payment.id },
    });

    // Update user's total earnings
    await prisma.user.update({
      where: { id: submission.userId },
      data: {
        totalEarnings: {
          increment: netAmount,
        },
        totalBounties: {
          increment: 1,
        },
      },
    });

    // Update company's stats
    await prisma.company.update({
      where: { id: submission.companyId },
      data: {
        totalBountiesPaid: {
          increment: amount,
        },
        resolvedVulnerabilities: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(
      { payment, message: 'Payment created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
