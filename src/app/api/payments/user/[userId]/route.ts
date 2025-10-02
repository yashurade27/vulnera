import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getUserPaymentsQuerySchema } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ userId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { userId } = await params;

    // Users can only view their own payments, admins can view any
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: { [key: string]: string | undefined } = {};
    if (searchParams.get('status')) query.status = searchParams.get('status')!;
    if (searchParams.get('limit')) query.limit = searchParams.get('limit')!;
    if (searchParams.get('offset')) query.offset = searchParams.get('offset')!;
    if (searchParams.get('sortBy')) query.sortBy = searchParams.get('sortBy')!;
    if (searchParams.get('sortOrder')) query.sortOrder = searchParams.get('sortOrder')!;

    const parsed = getUserPaymentsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      status,
      limit = 20,
      offset = 0,
      sortBy = 'initiatedAt',
      sortOrder = 'desc'
    } = parsed.data;

    // Build where clause
    const where: Prisma.PaymentWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    // Get payments with pagination
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
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
    console.error('Get user payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
