import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get session and check admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const reporterId = searchParams.get('reporterId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const sortBy = (searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'status') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Build where clause
    const where: Prisma.ReportWhereInput = {};
    if (status) where.status = status as 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';
    if (type) where.type = type as 'LATE_RESPONSE' | 'UNFAIR_REJECTION' | 'SPAM_SUBMISSION' | 'INAPPROPRIATE_CONTENT' | 'OTHER';
    if (reporterId) where.reporterId = reporterId;

    // Get total count for pagination
    const total = await prisma.report.count({ where });

    // Get reports with relations
    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
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
        submission: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      reports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Get admin reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
