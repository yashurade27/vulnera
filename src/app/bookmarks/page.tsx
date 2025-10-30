'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, Loader2, Search } from 'lucide-react'
import { BountyCard } from '@/components/bounty-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { BookmarkedBounty } from '@/lib/types'

export default function BookmarksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkedBounty[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const fetchBookmarks = useCallback(
    async (offsetParam: number = 0, append = false) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          limit: LIMIT.toString(),
          offset: offsetParam.toString(),
        })

        const response = await fetch(`/api/bookmarks?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch bookmarks: ${response.status}`)
        }

        const data = await response.json()

        const items = data.bookmarks || []
        if (append) {
          setBookmarks((prev) => [...prev, ...items])
        } else {
          setBookmarks(items)
        }
        setTotal(data.pagination?.total || 0)
        setHasMore(data.pagination?.hasMore || false)
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookmarks(0, false)
    }
  }, [status, fetchBookmarks])

  const handleLoadMore = () => {
    const newOffset = offset + LIMIT
    setOffset(newOffset)
    fetchBookmarks(newOffset, true)
  }

  const handleBookmarkRemoved = (bountyId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      // Remove the bookmark from the list
      setBookmarks((prev) => prev.filter((b) => b.id !== bountyId))
      setTotal((prev) => Math.max(0, prev - 1))
    }
  }

  const filteredBookmarks = bookmarks.filter((bounty) =>
    bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bounty.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bounty.company.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="container-custom py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <Bookmark className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bookmarked Bounties</h1>
              <p className="text-muted-foreground">
                {total} {total === 1 ? 'bounty' : 'bounties'} saved for later
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bookmarked bounties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {loading && bookmarks.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                <Bookmark className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No matching bookmarks found' : 'No bookmarks yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Start bookmarking bounties to keep track of interesting opportunities'}
                </p>
                {!searchQuery && (
                  <Button
                    asChild
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                  >
                    <Link href="/bounties">Browse Bounties</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookmarks.map((bounty) => (
              <BountyCard 
                key={bounty.id} 
                bounty={bounty} 
                onBookmarkChange={handleBookmarkRemoved}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !searchQuery && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              variant="outline"
              className="min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

