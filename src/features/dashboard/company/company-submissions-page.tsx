"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, ArrowUpRight, CheckCircle2, Filter, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CompanySummary {
  id: string
  name: string
}

interface SubmissionRow {
  id: string
  title: string
  status: string
  bountyTitle: string
  bountyType: string
  submittedAt: string
  reporterName: string
  reporterUsername?: string | null
}

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  APPROVED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  REJECTED: "bg-red-500/10 text-red-300 border-red-500/30",
  DUPLICATE: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  SPAM: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  NEEDS_MORE_INFO: "bg-sky-500/10 text-sky-300 border-sky-500/30",
}

const STATUS_FILTERS = [
  { label: "All statuses", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Needs info", value: "NEEDS_MORE_INFO" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Duplicate", value: "DUPLICATE" },
  { label: "Spam", value: "SPAM" },
]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function CompanySubmissionsPage() {
  const router = useRouter()
  const [company, setCompany] = useState<CompanySummary | null>(null)
  const [entries, setEntries] = useState<SubmissionRow[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCompany = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/companies/my-company", {
        credentials: "include",
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load company context")
      }
      const companyRecord: CompanySummary | undefined = payload?.company
      if (!companyRecord?.id) {
        throw new Error("No company is linked to this account")
      }
      setCompany(companyRecord)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadSubmissions = useCallback(
    async (companyId: string, status: string) => {
      setIsRefreshing(true)
      setError(null)
      try {
        const params = new URLSearchParams({ companyId, limit: "100" })
        if (status !== "ALL") {
          params.set("status", status)
        }
        const response = await fetch(`/api/submissions?${params.toString()}`, {
          credentials: "include",
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load submissions")
        }
        const mapped: SubmissionRow[] = Array.isArray(payload?.submissions)
          ? payload.submissions.map((submission: any) => ({
              id: submission?.id,
              title: submission?.title ?? "Submission",
              status: submission?.status ?? "PENDING",
              bountyTitle: submission?.bounty?.title ?? "Bounty",
              bountyType: submission?.bounty?.bountyType ?? submission?.bountyType ?? "UI",
              submittedAt: submission?.submittedAt ?? submission?.createdAt ?? new Date().toISOString(),
              reporterName:
                submission?.user?.fullName ??
                submission?.user?.username ??
                submission?.hunter?.name ??
                "Anonymous Hunter",
              reporterUsername: submission?.user?.username ?? submission?.hunter?.username ?? null,
            }))
          : []
        setEntries(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error")
      } finally {
        setIsRefreshing(false)
      }
    },
    []
  )

  useEffect(() => {
    void loadCompany()
  }, [loadCompany])

  useEffect(() => {
    if (!company?.id) return
    void loadSubmissions(company.id, statusFilter)
  }, [company?.id, loadSubmissions, statusFilter])

  const heading = useMemo(() => {
    if (!company?.name) return "Submission Inbox"
    return `${company.name} submissions`
  }, [company?.name])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Loading submission workspace…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="space-y-2 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <CardTitle>Unable to load submissions</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go back
            </Button>
            <Button onClick={() => void loadCompany()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold">Submission Review</h1>
              <p className="text-muted-foreground">{heading}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => company?.id && void loadSubmissions(company.id, statusFilter)}>
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refreshing
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <Card className="card-glass overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All submissions</CardTitle>
              <CardDescription>Review and take action on every hunter report.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/company">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to dashboard
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10" />
                <p>No submissions match the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60">
                      <TableHead className="min-w-[220px]">Submission</TableHead>
                      <TableHead className="min-w-[160px]">Bounty</TableHead>
                      <TableHead className="min-w-[120px]">Hunter</TableHead>
                      <TableHead className="min-w-[140px]">Status</TableHead>
                      <TableHead className="min-w-[160px]">Submitted</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id} className="border-border/40">
                        <TableCell>
                          <div className="font-medium text-sm text-foreground/90 line-clamp-2">{entry.title}</div>
                          <div className="text-xs text-muted-foreground">{entry.bountyType}</div>
                        </TableCell>
                        <TableCell className="text-sm text-foreground/80">{entry.bountyTitle}</TableCell>
                        <TableCell className="text-sm text-foreground/80">
                          {entry.reporterName}
                          {entry.reporterUsername ? ` (@${entry.reporterUsername})` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGES[entry.status] ?? "bg-white/5 text-white border-white/10"}
                          >
                            {entry.status.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dateFormatter.format(new Date(entry.submittedAt))}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/company/submissions/${entry.id}`} aria-label="Review submission">
                              <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
