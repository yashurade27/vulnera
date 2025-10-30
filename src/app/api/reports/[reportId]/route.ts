import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateReportSchema, type UpdateReportInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ reportId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { reportId } = await params;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        submission: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            submittedAt: true,
            bounty: {
              select: {
                id: true,
                title: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
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
            role: true,
            status: true,
          },
        },
        reportedCompany: {
          select: {
            id: true,
            name: true,
            slug: true,
            isVerified: true,
            isActive: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check permissions: reporter, reported entities, or admin can view
    const canView = session.user.role === 'ADMIN' ||
      report.reporterId === session.user.id ||
      report.reportedUserId === session.user.id ||
      report.reportedCompanyId === session.user.id;

    if (!canView) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ report });

  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ reportId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can update report status
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { reportId } = await params;

    const body: UpdateReportInput = await request.json();
    const parsed = updateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: parsed.data,
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

    return NextResponse.json({ report: updatedReport });

  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
