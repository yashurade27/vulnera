import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveReportSchema, type ResolveReportInput } from '@/lib/types';
import { type RouteParams } from '@/lib/next';

export async function POST(
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

    // Only admins can resolve reports
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

  const { reportId } = await params;

    const body: ResolveReportInput = await request.json();
    const parsed = resolveReportSchema.safeParse(body);

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

    if (report.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Report is already resolved' },
        { status: 400 }
      );
    }

    const resolvedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        resolution: parsed.data.resolution,
        actionTaken: parsed.data.actionTaken,
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

    return NextResponse.json({ report: resolvedReport });

  } catch (error) {
    console.error('Resolve report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
