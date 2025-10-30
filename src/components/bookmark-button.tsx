'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { AddBookmarkInput } from '@/lib/types'

interface BookmarkButtonProps {
  bountyId: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
  onBookmarkChange?: (bountyId: string, isBookmarked: boolean) => void
}

export function BookmarkButton({
  bountyId,
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
  className,
  onBookmarkChange,
}: BookmarkButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      checkBookmarkStatus()
    } else if (status === 'unauthenticated') {
      setIsChecking(false)
    }
  }, [status, session, bountyId])

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/bookmarks/check?bountyId=${bountyId}`)
      if (response.ok) {
        const data = await response.json()
        setIsBookmarked(data.isBookmarked)
      }
    } catch (error) {
      console.error('Failed to check bookmark status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (status !== 'authenticated') {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?bountyId=${bountyId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setIsBookmarked(false)
          toast.success('Bookmark removed')
          onBookmarkChange?.(bountyId, false)
        } else {
          throw new Error('Failed to remove bookmark')
        }
      } else {
        // Add bookmark
        const bookmarkData: AddBookmarkInput = { bountyId }
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookmarkData),
        })

        if (response.ok) {
          setIsBookmarked(true)
          toast.success('Bounty bookmarked')
          onBookmarkChange?.(bountyId, true)
        } else {
          throw new Error('Failed to add bookmark')
        }
      }
    } catch (error) {
      console.error('Bookmark toggle error:', error)
      toast.error('Failed to update bookmark')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={cn(
        'transition-colors',
        isBookmarked && 'text-yellow-400 hover:text-yellow-500',
        className
      )}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this bounty'}
    >
      <Bookmark
        className={cn(
          'w-4 h-4',
          isBookmarked && 'fill-current',
          showLabel && 'mr-2'
        )}
      />
      {showLabel && (isBookmarked ? 'Bookmarked' : 'Bookmark')}
    </Button>
  )
}

