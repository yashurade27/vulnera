"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  userId?: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const payload = { unreadCount: 3 };
      setUnreadCount(typeof payload?.unreadCount === "number" ? payload.unreadCount : 0);
    } catch (error) {
      console.error("Failed to load unread notifications", error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return
    let isActive = true
    let intervalId: NodeJS.Timeout | null = null

    const load = async () => {
      if (!isActive) return
      await fetchUnreadCount()
    }

    void load()
    intervalId = setInterval(load, 30000)

    return () => {
      isActive = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [fetchUnreadCount, userId])

  if (!userId) {
    return null
  }

  const handleClick = () => {
    router.push("/notifications")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-10 w-10 text-muted-foreground hover:text-yellow-300"
      aria-label="Open notifications"
      onClick={handleClick}
    >
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
      <span
        className={cn(
          "pointer-events-none absolute -top-1.5 -right-1.5 min-w-[1.25rem] rounded-full bg-yellow-400 px-1 text-center text-[0.65rem] font-semibold text-gray-900",
          unreadCount === 0 && "hidden"
        )}
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    </Button>
  )
}
