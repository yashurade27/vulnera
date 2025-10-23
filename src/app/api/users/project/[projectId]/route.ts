import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { updateProjectSchema, type UpdateProjectInput } from '@/lib/types'
import { type RouteParams } from '@/lib/next'

/**
 * PATCH /api/users/project/[projectId]
 * Update a specific project
 */
export async function PATCH(request: NextRequest, { params }: RouteParams<{ projectId: string }>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Check if project exists and belongs to the user
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Only allow users to update their own projects or admins
    if (existingProject.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: UpdateProjectInput = await request.json()
    const parsed = updateProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...parsed.data,
        // Convert empty strings to null for optional fields
        description: parsed.data.description === '' ? null : parsed.data.description,
        website: parsed.data.website === '' ? null : parsed.data.website,
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

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/users/project/[projectId]
 * Delete a specific project
 */
export async function DELETE(request: NextRequest, { params }: RouteParams<{ projectId: string }>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await params

    // Check if project exists and belongs to the user
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, name: true },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Only allow users to delete their own projects or admins
    if (existingProject.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the project
    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json(
      {
        message: 'Project deleted successfully',
        deletedProject: {
          id: projectId,
          name: existingProject.name,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
