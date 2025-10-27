import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getBookmarksQuerySchema } from '@/lib/types'
import { authOptions } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validationResult = getBookmarksQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { limit = 20, offset = 0 } = validationResult.data

    const [bookmarks, total] = await Promise.all([
      prisma.bountyBookmark.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          bounty: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  isVerified: true,
                },
              },
              _count: {
                select: {
                  submissions: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.bountyBookmark.count({
        where: {
          userId: session.user.id,
        },
      }),
    ])

    const bounties = bookmarks.map((bookmark) => ({
      ...bookmark.bounty,
      rewardAmount: Number(bookmark.bounty.rewardAmount),
      paidOut: Number(bookmark.bounty.paidOut),
      bookmarkedAt: bookmark.createdAt,
      bookmarkId: bookmark.id,
    }))

    return NextResponse.json({
      bookmarks: bounties,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const { addBookmarkSchema } = await import('@/lib/types')
    const validationResult = addBookmarkSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { bountyId } = validationResult.data

    // Check if bounty exists
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
    })

    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    // Check if already bookmarked
    const existing = await prisma.bountyBookmark.findUnique({
      where: {
        userId_bountyId: {
          userId: session.user.id,
          bountyId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Bounty already bookmarked' }, { status: 400 })
    }

    // Create bookmark
    const bookmark = await prisma.bountyBookmark.create({
      data: {
        userId: session.user.id,
        bountyId,
      },
    })

    return NextResponse.json({
      message: 'Bookmark added successfully',
      bookmark,
    })
  } catch (error) {
    console.error('Add bookmark error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove bookmark
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const { removeBookmarkSchema } = await import('@/lib/types')
    const validationResult = removeBookmarkSchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { bountyId } = validationResult.data

    // Delete bookmark
    const deleted = await prisma.bountyBookmark.deleteMany({
      where: {
        userId: session.user.id,
        bountyId,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Bookmark removed successfully',
    })
  } catch (error) {
    console.error('Remove bookmark error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

