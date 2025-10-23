import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createProjectSchema, getProjectsQuerySchema, type CreateProjectInput } from '@/lib/types'

/**
 * GET /api/users/project
 * List all projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    }

    const parsed = getProjectsQuerySchema.safeParse(queryParams)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { limit = 50, offset = 0, sortBy, sortOrder } = parsed.data

    // Get projects for the authenticated user
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          name: true,
          description: true,
          website: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.project.count({
        where: {
          userId: session.user.id,
        },
      }),
    ])

    return NextResponse.json({
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/users/project
 * Create a new project for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateProjectInput = await request.json()
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, description, website } = parsed.data

    // Create the project
    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        website: website || null,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        website: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

