"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { SubmissionStatus } from "@prisma/client"
import {
  UserSubmissionsResponse,
  type UserSubmissionSummary,
  type UserSubmissionsSortField,
  type UserSubmissionsSortOrder,
} from "./data-access/use-user-submissions-query"
import { useUserSubmissionsQuery } from "./data-access/use-user-submissions-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock,
  Download,
  Filter,
  Flame,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trophy,
} from "lucide-react"

const PAGE_SIZE = 10

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DUPLICATE: "Duplicate",
  SPAM: "Spam",
  NEEDS_MORE_INFO: "Needs More Info",
}

const STATUS_BADGES: Record<SubmissionStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/40",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/40",
  DUPLICATE: "bg-purple-500/10 text-purple-400 border-purple-500/40",
  SPAM: "bg-orange-500/10 text-orange-400 border-orange-500/40",
  NEEDS_MORE_INFO: "bg-sky-500/10 text-sky-400 border-sky-500/40",
}

const RELATIVE_DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
]

type StatusFilter = "ALL" | SubmissionStatus

interface UserSubmissionsPageProps {
  userId: string
}

export function UserSubmissionsPage({ userId }: UserSubmissionsPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState<UserSubmissionsSortField>("submittedAt")
  const [sortOrder, setSortOrder] = useState<UserSubmissionsSortOrder>("desc")
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [activeBountyFilter, setActiveBountyFilter] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, debouncedSearch, sortBy, sortOrder, activeBountyFilter])

  const { data, isLoading, isFetching, isError, error, refetch } = useUserSubmissionsQuery({
    userId,
    page,
    limit: PAGE_SIZE,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
    bountyId: activeBountyFilter ?? undefined,
  })

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.pagination.total / PAGE_SIZE))
  }, [data])

  const statusCounts = useMemo(() => {
    if (!data) {
      return {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        DUPLICATE: 0,
        SPAM: 0,
        NEEDS_MORE_INFO: 0,
      } satisfies Record<SubmissionStatus, number>
    }

    return data.stats.statusBreakdown
  }, [data])

  const statusOptions = useMemo(
    () => [
      { value: "ALL" as StatusFilter, label: "All", count: data?.stats.total ?? 0 },
      ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
        value: value as SubmissionStatus,
        label,
        count: statusCounts[value as SubmissionStatus] ?? 0,
      })),
    ],
    [data?.stats.total, statusCounts],
  )

  const joinedLabel = data
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(data.user.createdAt))
    : "—"

  const latestSubmissionLabel = data ? formatRelativeTime(data.stats.latestSubmissionAt) : "—"

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)

      const params = new URLSearchParams()
      params.set("limit", "250")
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (activeBountyFilter) params.set("bountyId", activeBountyFilter)

      const response = await fetch(`/api/users/${userId}/submissions?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`)
      }

      const payload = (await response.json()) as UserSubmissionsResponse
      const rows = payload.submissions.map((submission) => [
        submission.id,
        sanitizeCsv(submission.title),
        submission.status,
        submission.bounty?.title ?? "",
        submission.company?.name ?? "",
        formatDateTime(submission.submittedAt),
        submission.rewardAmount ?? "",
      ])

      const header = [
        "Submission ID",
        "Title",
        "Status",
        "Bounty",
        "Company",
        "Submitted At",
        "Reward",
      ]

      const csv = [header, ...rows].map((values) => values.map(escapeCsvValue).join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `vulnera-user-${userId}-submissions.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      console.error("Export submissions error", exportError)
    } finally {
      setIsExporting(false)
    }
  }, [activeBountyFilter, debouncedSearch, sortBy, sortOrder, statusFilter, userId])

  const handleResetFilters = useCallback(() => {
    setStatusFilter("ALL")
    setSearchInput("")
    setActiveBountyFilter(null)
  }, [])

  if (isLoading && !data) {
    return <UserSubmissionsSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 radial-gradient-yellow">
        <div className="container-custom py-8">
          {data ? (
            <HeroHeader
              user={data.user}
              stats={data.stats}
              joinedLabel={joinedLabel}
              latestSubmissionLabel={latestSubmissionLabel}
            />
          ) : (
            <UserSubmissionsSkeleton />
          )}
        </div>
      </div>

      <div className="container-custom py-10 space-y-8">
        <Card className="card-glass">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-yellow-400" /> Filters
              </CardTitle>
              <CardDescription>Refine the submission history by status, keyword, or top bounty.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleResetFilters} disabled={!data}>
                <RefreshCcw className="w-4 h-4 mr-2" />Reset
              </Button>
              <Button onClick={() => void refetch()} variant="secondary" disabled={isFetching}>
                {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
              <Button
                variant="default"
                onClick={handleExport}
                disabled={isExporting || !data || data.pagination.total === 0}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
              >
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((option) => {
                const isActive = statusFilter === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-all",
                      isActive
                        ? "border-yellow-500/60 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg"
                        : "border-border bg-card/60 text-muted-foreground hover:border-yellow-500/40 hover:text-foreground",
                    )}
                  >
                    <span>{option.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{option.count}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by submission title, bounty, or company"
                  className="pl-9"
                />
              </div>

              <Select value={sortBy} onValueChange={(value: UserSubmissionsSortField) => setSortBy(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedAt">Submitted date</SelectItem>
                  <SelectItem value="rewardAmount">Reward amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setSortOrder((current) => (current === "asc" ? "desc" : "asc"))}>
                <ArrowUpRight
                  className={cn(
                    "mr-2 h-4 w-4 transition-transform",
                    sortOrder === "asc" ? "rotate-180" : "rotate-45",
                  )}
                />
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {data?.stats.topBounties.length ? (
          <aside className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold">Top bounty targets</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Focus on the programs delivering the most submissions for this hunter.
            </p>
            <div className="mt-4 space-y-3">
              {data.stats.topBounties.map((item) => {
                const isActive = activeBountyFilter === item.bountyId
                return (
                  <button
                    key={item.bountyId}
                    type="button"
                    onClick={() => setActiveBountyFilter(isActive ? null : item.bountyId)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-all",
                      isActive
                        ? "border-yellow-500 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg"
                        : "border-white/10 bg-card/70 text-foreground hover:border-yellow-500/40",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.company?.name ?? "Independent"}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                      >
                        {item.submissions} reports
                      </Badge>
                    </div>
                    {item.rewardAmount ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Avg reward budget: {item.rewardAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL
                      </p>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </aside>
        ) : null}

        {isError ? (
          <ErrorState message={error instanceof Error ? error.message : "Unable to load submissions"} />
        ) : (
          <SubmissionsList
            submissions={data?.submissions ?? []}
            isFetching={isFetching}
            page={page}
            totalPages={totalPages}
            hasMore={data?.pagination.hasMore ?? false}
            onNextPage={() => setPage((current) => Math.min(current + 1, totalPages))}
            onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
          />
        )}
      </div>
    </div>
  )
}

function HeroHeader({
  user,
  stats,
  joinedLabel,
  latestSubmissionLabel,
}: {
  user: UserSubmissionsResponse["user"]
  stats: UserSubmissionsResponse["stats"]
  joinedLabel: string
  latestSubmissionLabel: string
}) {
  const displayName = user.fullName || user.username || "Anonymous Hunter"
  const initials = (user.fullName || user.username || "HN")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")

  return (
    <Card className="card-glass overflow-hidden border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-yellow-400/40 shadow-lg">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-yellow-500/20 text-yellow-300">{initials}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold text-foreground">{displayName}</h1>
              <Badge
                variant="outline"
                className="border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              >
                Reputation {Math.round(user.reputation ?? 0)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Hunter since {joinedLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Last submission {latestSubmissionLabel}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <StatBlock
            icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
            label="Total submissions"
            value={stats.total.toLocaleString()}
          />
          <StatBlock
            icon={<Flame className="h-5 w-5 text-yellow-300" />}
            label="Total rewards"
            value={`${stats.totalReward.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`}
          />
          <StatBlock
            icon={<Clock className="h-5 w-5 text-sky-300" />}
            label="Latest activity"
            value={latestSubmissionLabel}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StatBlock({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/70 px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-yellow-500/10 p-2 text-yellow-300">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

function SubmissionsList({
  submissions,
  isFetching,
  page,
  totalPages,
  hasMore,
  onNextPage,
  onPreviousPage,
}: {
  submissions: UserSubmissionSummary[]
  isFetching: boolean
  page: number
  totalPages: number
  hasMore: boolean
  onNextPage: () => void
  onPreviousPage: () => void
}) {
  if (!submissions.length) {
    return (
      <Card className="card-glass">
        <CardHeader className="text-center">
          <CardTitle>No submissions yet</CardTitle>
          <CardDescription>
            When this hunter reports vulnerabilities, their full activity will appear here with status updates.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="card-glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Submission history</CardTitle>
            <CardDescription>
              Track program activity, outcomes, and follow-up actions across every bounty engagement.
            </CardDescription>
          </div>
          {isFetching ? <Loader2 className="h-5 w-5 animate-spin text-yellow-400" /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {submissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}

        <Separator className="border-border/60" />

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onPreviousPage} disabled={page === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button variant="ghost" onClick={onNextPage} disabled={!hasMore}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SubmissionCard({ submission }: { submission: UserSubmissionSummary }) {
  const [copied, setCopied] = useState(false)

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(submission.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (copyError) {
      console.error("Copy submission id error", copyError)
    }
  }

  const relativeSubmitted = formatRelativeTime(submission.submittedAt)
  const submittedAtLabel = formatDateTime(submission.submittedAt)
  const reviewedAtLabel = submission.reviewedAt ? formatDateTime(submission.reviewedAt) : null

  return (
    <div className="rounded-2xl border border-white/10 bg-card/70 p-5 transition-all duration-200 hover:border-yellow-500/40 hover:shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("border", STATUS_BADGES[submission.status])}>
              {STATUS_LABELS[submission.status]}
            </Badge>
            {submission.bounty?.title ? (
              <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-300">
                {submission.bounty.title}
              </Badge>
            ) : null}
            {submission.company?.name ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" /> {submission.company.name}
              </span>
            ) : null}
          </div>

          <h3 className="text-lg font-semibold text-foreground">{submission.title}</h3>
          <p className="text-sm text-muted-foreground">
            Submitted {relativeSubmitted} ({submittedAtLabel})
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> {submission._count.comments} comments
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Response due {formatDateTime(submission.responseDeadline)}
            </div>
            {submission.rewardAmount ? (
              <div className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                Potential reward {submission.rewardAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <Button variant="outline" size="sm" onClick={handleCopyId}>
            {copied ? "Copied" : "Copy ID"}
          </Button>
          {reviewedAtLabel ? (
            <p className="text-xs text-muted-foreground">Reviewed on {reviewedAtLabel}</p>
          ) : (
            <p className="text-xs text-yellow-300">Awaiting formal review</p>
          )}
        </div>
      </div>

      {submission.reviewNotes ? (
        <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-yellow-200">Reviewer notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{submission.reviewNotes}</p>
        </div>
      ) : null}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="card-glass border-red-500/40">
      <CardHeader className="flex flex-col items-center text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <CardTitle>Unable to load submissions</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function UserSubmissionsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-20 w-full rounded-3xl" />
    </div>
  )
}

function formatRelativeTime(value: string | null): string {
  if (!value) return "—"
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  let duration = (new Date(value).getTime() - Date.now()) / 1000

  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }

  return formatter.format(0, "second")
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function sanitizeCsv(value: string) {
  return value.replaceAll(/\r?\n|\r/g, " ")
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  const stringValue = String(value)
  if (stringValue.includes(",") || stringValue.includes("\"")) {
    return `"${stringValue.replaceAll("\"", '""')}"`
  }
  return stringValue
}
