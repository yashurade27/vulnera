import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBookmarkSchema } from '@/lib/types'

// GET - Check if bounty is bookmarked
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validationResult = checkBookmarkSchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { bountyId } = validationResult.data

    const bookmark = await prisma.bountyBookmark.findUnique({
      where: {
        userId_bountyId: {
          userId: session.user.id,
          bountyId,
        },
      },
    })

    return NextResponse.json({
      isBookmarked: !!bookmark,
      bookmarkId: bookmark?.id,
    })
  } catch (error) {
    console.error('Check bookmark error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

