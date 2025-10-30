"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  FileText,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Ban,
  MessageSquare,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Submissions", icon: FileText },
  { value: "PENDING", label: "Pending Review", icon: Clock },
  { value: "APPROVED", label: "Approved", icon: CheckCircle2 },
  { value: "REJECTED", label: "Rejected", icon: XCircle },
  { value: "NEEDS_MORE_INFO", label: "Needs Info", icon: AlertCircle },
  { value: "DUPLICATE", label: "Duplicate", icon: Copy },
  { value: "SPAM", label: "Spam", icon: Ban },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 border-yellow-400/40 text-yellow-200",
  APPROVED: "bg-green-500/10 border-green-400/40 text-green-200",
  REJECTED: "bg-red-500/10 border-red-400/40 text-red-200",
  NEEDS_MORE_INFO: "bg-blue-500/10 border-blue-400/40 text-blue-200",
  DUPLICATE: "bg-gray-500/10 border-gray-400/40 text-gray-200",
  SPAM: "bg-orange-500/10 border-orange-400/40 text-orange-200",
}

interface Submission {
  id: string
  title: string
  status: string
  bountyType: string
  submittedAt: string
  bounty?: {
    id: string
    title: string
    rewardAmount: number
    company?: {
      name: string
    }
  } | null
  company?: {
    id: string
    name: string
  } | null
  _count?: {
    comments: number
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function SubmissionsListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: sessionStatus } = useSession()
  
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL")

  const fetchSubmissions = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
      })

      if (statusFilter && statusFilter !== "ALL") {
        params.append("status", statusFilter)
      }

      if (search) {
        params.append("search", search)
      }

      const response = await fetch(
        `/api/users/${session.user.id}/submissions?${params.toString()}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch submissions")
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
      setTotal(data.pagination?.total || 0)
    } catch (error) {
      console.error("Error fetching submissions:", error)
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, statusFilter, search])

  useEffect(() => {
    if (sessionStatus !== "loading") {
      fetchSubmissions()
    }
  }, [sessionStatus, fetchSubmissions])

  useEffect(() => {
    // Update URL when filter changes
    const params = new URLSearchParams()
    if (statusFilter !== "ALL") {
      params.set("status", statusFilter)
    }
    const newUrl = params.toString() ? `/submissions?${params.toString()}` : "/submissions"
    router.replace(newUrl, { scroll: false })
  }, [statusFilter, router])

  if (sessionStatus === "loading") {
    return null
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 text-center space-y-4">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Sign in to view your submissions.</p>
              <Button asChild>
                <Link href="/auth/login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_OPTIONS.find((opt) => opt.value === statusFilter) || STATUS_OPTIONS[0]
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className=" border-b border-border bg-card/40 bg-neutral-100 dark:bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard/hunter">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <StatusIcon className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl lg:text-5xl font-medium">
              My <span className="text-yellow-400">Submissions</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track all your vulnerability submissions in one place
          </p>
        </div>
      </div>

      <div className="container-custom py-10">
        {/* Filters */}
        <div className="grid md:grid-cols-[1fr_2fr] gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATUS_OPTIONS.slice(1).map((option) => {
            const Icon = option.icon
            const count = submissions.filter((s) => s.status === option.value).length
            return (
              <Card key={option.value} className="card-glass cursor-pointer hover:border-yellow-400/50 transition" onClick={() => setStatusFilter(option.value)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{option.label}</span>
                  </div>
                  <p className="text-2xl font-semibold">{statusFilter === "ALL" ? count : total}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : submissions.length === 0 ? (
          <Card className="card-glass">
            <CardContent className="p-12 text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No submissions found</h3>
                <p className="text-muted-foreground mb-6">
                  {statusFilter !== "ALL"
                    ? `You don't have any ${statusFilter.toLowerCase()} submissions yet.`
                    : "Start hunting for vulnerabilities and submit your findings!"}
                </p>
                <Button asChild className="btn-primary">
                  <Link href="/bounties">Browse Bounties</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted-foreground">
                Showing {submissions.length} of {total} submission{total !== 1 ? "s" : ""}
              </p>
            </div>

            {submissions.map((submission) => (
              <Card
                key={submission.id}
                className="card-glass hover:border-yellow-400/50 transition cursor-pointer"
                onClick={() => router.push(`/submissions/${submission.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[submission.status] || ""}
                        >
                          {submission.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-500/10 border-purple-400/40 text-purple-200">
                          {submission.bountyType}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                        {submission.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {submission.bounty?.title || "Bounty"} · {submission.bounty?.company?.name || submission.company?.name || "Company"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-semibold text-yellow-400">
                        {currencyFormatter.format(submission.bounty?.rewardAmount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Reward</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateFormatter.format(new Date(submission.submittedAt))}
                      </span>
                      {submission._count && submission._count.comments > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {submission._count.comments} comment{submission._count.comments !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
