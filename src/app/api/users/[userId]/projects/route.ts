import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { type RouteParams } from '@/lib/next'

/**
 * GET /api/users/[userId]/projects
 * Get all projects for a specific user (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ userId: string }>
) {
  try {
    const { userId } = await params

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get projects for the user
    const projects = await prisma.project.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Get user projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

