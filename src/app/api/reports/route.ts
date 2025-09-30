import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createReportSchema, getReportsQuerySchema, type CreateReportInput, type GetReportsQuery } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can view all reports
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsedQuery = getReportsQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsedQuery.error.issues },
        { status: 400 }
      );
    }

    const {
      status,
      type,
      reporterId,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = parsedQuery.data;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (reporterId) where.reporterId = reporterId;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
            },
          },
          submission: {
            select: {
              id: true,
              title: true,
              status: true,
              bounty: {
                select: {
                  id: true,
                  title: true,
                  company: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
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
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      }),
      prisma.report.count({ where }),
    ]);

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
    console.error('Get reports error:', error);
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

    const body: CreateReportInput = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { submissionId, reportedUserId, reportedCompanyId, ...reportData } = parsed.data;

    // Validate that the reported entities exist
    if (submissionId) {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });
      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
    }

    if (reportedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: reportedUserId },
      });
      if (!user) {
        return NextResponse.json(
          { error: 'Reported user not found' },
          { status: 404 }
        );
      }
    }

    if (reportedCompanyId) {
      const company = await prisma.company.findUnique({
        where: { id: reportedCompanyId },
      });
      if (!company) {
        return NextResponse.json(
          { error: 'Reported company not found' },
          { status: 404 }
        );
      }
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        ...reportData,
        reporterId: session.user.id,
        submissionId,
        reportedUserId,
        reportedCompanyId,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        submission: {
          select: {
            id: true,
            title: true,
            status: true,
            bounty: {
              select: {
                id: true,
                title: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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
    });

    return NextResponse.json({ report }, { status: 201 });

  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
