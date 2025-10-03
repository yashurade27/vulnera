"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Bell, Inbox, MailCheck, Loader2, Trash2, CircleDot, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  actionUrl?: string | null
  isRead: boolean
  createdAt: string
  readAt?: string | null
}

type NotificationFilter = "all" | "unread"

export function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({})
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = async (selectedFilter: NotificationFilter) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ limit: "50" })
      if (selectedFilter === "unread") {
        params.set("isRead", "false")
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Unable to load notifications")
      }

      const payload = await response.json()
      const mapped: NotificationItem[] = Array.isArray(payload?.notifications)
        ? payload.notifications.map((item: any) => ({
            id: item?.id,
            title: item?.title ?? "Notification",
            message: item?.message ?? "",
            type: item?.type ?? "GENERAL",
            actionUrl: item?.actionUrl ?? null,
            isRead: Boolean(item?.isRead),
            createdAt: item?.createdAt ?? new Date().toISOString(),
            readAt: item?.readAt ?? null,
          }))
        : []

      setItems(mapped)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Unexpected error loading notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications(filter)
  }, [filter])

  const markRead = async (id: string) => {
    try {
      setProcessingIds((prev) => ({ ...prev, [id]: true }))
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item)))
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to mark as read")
    } finally {
      setProcessingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      setProcessingIds((prev) => ({ ...prev, [id]: true }))
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete notification")
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
      toast.success("Notification removed")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to delete notification")
    } finally {
      setProcessingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const markAllRead = async () => {
    try {
      setMarkingAll(true)
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to mark notifications")
      }

      setItems((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })))
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to mark notifications")
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-12 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-semibold flex items-center gap-3">
                <Bell className="w-10 h-10 text-yellow-400" /> Notifications
              </h1>
              <p className="text-muted-foreground text-lg">Stay up to date with submissions, payments, and bounty updates.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-yellow-400 text-slate-900" : ""}
              >
                <Filter className="w-4 h-4 mr-2" /> All
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                onClick={() => setFilter("unread")}
                className={filter === "unread" ? "bg-yellow-400 text-slate-900" : ""}
              >
                <CircleDot className="w-4 h-4 mr-2" /> Unread
              </Button>
              <Button variant="ghost" onClick={markAllRead} disabled={markingAll || items.length === 0}>
                {markingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MailCheck className="w-4 h-4 mr-2" />}
                Mark all read
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="card-glass border border-red-500/40 max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <Inbox className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => void loadNotifications(filter)}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="card-glass max-w-2xl mx-auto">
            <CardContent className="p-10 text-center space-y-4 text-muted-foreground">
              <Inbox className="w-12 h-12 mx-auto" />
              <p>No notifications yet. We will alert you about submissions, payments, and platform activity.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {items.map((notification) => {
              const busy = processingIds[notification.id]
              return (
                <Card
                  key={notification.id}
                  className={`card-glass border ${notification.isRead ? "border-border" : "border-yellow-500/40"}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {!notification.isRead ? <Badge className="bg-yellow-400 text-slate-900">New</Badge> : null}
                        {notification.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!notification.isRead ? (
                        <Button variant="outline" size="sm" onClick={() => void markRead(notification.id)} disabled={busy}>
                          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Mark read
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => void deleteNotification(notification.id)}
                        disabled={busy}
                      >
                        {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {notification.message}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Type: {notification.type}</span>
                      {notification.actionUrl ? (
                        <Button variant="link" size="sm" asChild className="px-0">
                          <Link href={notification.actionUrl}>Open related item</Link>
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
