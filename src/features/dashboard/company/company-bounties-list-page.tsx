"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Target,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  ArrowLeft,
  Loader2,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Bounties", icon: Target },
  { value: "ACTIVE", label: "Active", icon: CheckCircle2 },
  { value: "CLOSED", label: "Closed", icon: XCircle },
  { value: "EXPIRED", label: "Expired", icon: Clock },
]

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 border-green-400/40 text-green-200",
  CLOSED: "bg-gray-500/10 border-gray-400/40 text-gray-200",
  EXPIRED: "bg-red-500/10 border-red-400/40 text-red-200",
}

interface Bounty {
  id: string
  title: string
  status: string
  bountyTypes?: string[]
  rewardAmount: number
  totalSubmissions: number
  validSubmissions: number
  createdAt: string
  endsAt?: string
  _count?: {
    submissions: number
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

export function CompanyBountiesListPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const fetchCompany = useCallback(async () => {
    try {
      const response = await fetch("/api/companies/my-company", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setCompanyId(data.company?.id || null)
      }
    } catch (error) {
      console.error("Error fetching company:", error)
    }
  }, [])

  const fetchBounties = useCallback(async () => {
    if (!companyId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
        sortBy: "createdAt",
        sortOrder: "desc",
      })

      if (statusFilter && statusFilter !== "ALL") {
        params.append("status", statusFilter)
      }

      if (search) {
        params.append("search", search)
      }

      const response = await fetch(
        `/api/companies/${companyId}/bounties?${params.toString()}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch bounties")
      }

      const data = await response.json()
      setBounties(data.bounties || [])
    } catch (error) {
      console.error("Error fetching bounties:", error)
      setBounties([])
    } finally {
      setLoading(false)
    }
  }, [companyId, statusFilter, search])

  useEffect(() => {
    if (sessionStatus !== "loading") {
      fetchCompany()
    }
  }, [sessionStatus, fetchCompany])

  useEffect(() => {
    if (companyId) {
      fetchBounties()
    }
  }, [companyId, fetchBounties])

  if (sessionStatus === "loading") {
    return null
  }

  if (!session?.user || session.user.role !== "COMPANY_ADMIN") {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 text-center space-y-4">
              <Target className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Access denied. Company admin only.</p>
              <Button asChild>
                <Link href="/dashboard/hunter">Go to Dashboard</Link>
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
      <div className="border-b border-border bg-card/40 bg-neutral-100 dark:bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard/company">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <StatusIcon className="w-8 h-8 text-yellow-400" />
                <h1 className="text-4xl lg:text-5xl font-medium">
                  Manage <span className="text-yellow-400">Bounties</span>
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                View and manage all your bug bounty programs
              </p>
            </div>
            <Button asChild className="btn-primary">
              <Link href="/dashboard/company/bounties/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Bounty
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {/* Filters */}
        <div className="grid md:grid-cols-[1fr_2fr] gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bounties..."
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="card-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Bounties</p>
                  <p className="text-3xl font-semibold">
                    {bounties.filter((b) => b.status === "ACTIVE").length}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
                  <p className="text-3xl font-semibold">
                    {bounties.reduce((sum, b) => sum + (b._count?.submissions || 0), 0)}
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Rewards</p>
                  <p className="text-3xl font-semibold text-yellow-400">
                    {currencyFormatter.format(
                      bounties.reduce((sum, b) => sum + Number(b.rewardAmount), 0)
                    )}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bounties List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : bounties.length === 0 ? (
          <Card className="card-glass">
            <CardContent className="p-12 text-center space-y-4">
              <Target className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No bounties found</h3>
                <p className="text-muted-foreground mb-6">
                  {statusFilter !== "ALL"
                    ? `No ${statusFilter.toLowerCase()} bounties yet.`
                    : "Create your first bug bounty program to get started!"}
                </p>
                <Button asChild className="btn-primary">
                  <Link href="/dashboard/company/bounties/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Bounty
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty) => (
              <Card
                key={bounty.id}
                className="card-glass hover:border-yellow-400/50 transition cursor-pointer"
                onClick={() => router.push(`/bounties/${bounty.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[bounty.status] || ""}
                        >
                          {bounty.status}
                        </Badge>
                        {(bounty.bountyTypes || []).map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="bg-purple-500/10 border-purple-400/40 text-purple-200"
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-xl font-semibold mb-2 line-clamp-1">
                        {bounty.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created {dateFormatter.format(new Date(bounty.createdAt))}
                        </span>
                        {bounty.endsAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Ends {dateFormatter.format(new Date(bounty.endsAt))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-yellow-400">
                        {currencyFormatter.format(bounty.rewardAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Max Reward</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{bounty._count?.submissions || 0}</span> Submissions
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-semibold">{bounty.validSubmissions || 0}</span> Valid
                      </span>
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
