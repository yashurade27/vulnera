"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  Target,
  Filter,
  Search,
  DollarSign,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  Globe,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Shield,
  TrendingUp,
  Award,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Bounties", icon: Target },
  { value: "ACTIVE", label: "Active", icon: CheckCircle2 },
]

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest First", icon: Calendar },
  { value: "rewardAmount", label: "Highest Reward", icon: DollarSign },
  { value: "endsAt", label: "Ending Soon", icon: Clock },
]

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 border-green-400/40 text-green-200",
  CLOSED: "bg-gray-500/10 border-gray-400/40 text-gray-200",
  EXPIRED: "bg-red-500/10 border-red-400/40 text-red-200",
}

interface Company {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  logoUrl?: string
  industry?: string
  location?: string
  isVerified: boolean
  reputation: number
  activeBounties: number
  resolvedVulnerabilities: number
  totalBountiesPaid: number
}

interface Bounty {
  id: string
  title: string
  description: string
  status: string
  bountyTypes?: string[]
  rewardAmount: number
  totalSubmissions: number
  validSubmissions: number
  createdAt: string
  endsAt?: string
  startsAt?: string
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

export function CompanyBountiesPublicPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = React.use(params)
  const router = useRouter()
  
  const [company, setCompany] = useState<Company | null>(null)
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ACTIVE")
  const [sortBy, setSortBy] = useState("createdAt")

  const fetchCompany = useCallback(async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch company")
      }

      const data = await response.json()
      setCompany(data.company || data)
    } catch (error) {
      console.error("Error fetching company:", error)
    }
  }, [companyId])

  const fetchBounties = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
        sortBy: sortBy,
        sortOrder: sortBy === "rewardAmount" ? "desc" : "desc",
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
  }, [companyId, statusFilter, search, sortBy])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  useEffect(() => {
    if (company) {
      fetchBounties()
    }
  }, [company, fetchBounties])

  if (loading && !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 text-center space-y-4">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Company not found</p>
              <Button asChild variant="outline">
                <Link href="/bounties">Browse All Bounties</Link>
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
      {/* Company Header */}
      <div className=" border-b border-border bg-card/40 bg-neutral-100 dark:bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-10">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8">
            <Avatar className="h-20 w-20 border border-yellow-500/30">
              {company.logoUrl && <AvatarImage src={company.logoUrl} alt={company.name} />}
              <AvatarFallback className="bg-yellow-500/10 text-yellow-200 text-xl font-semibold">
                {company.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1 className="text-4xl lg:text-5xl font-medium">
                  {company.name}
                </h1>
                {company.isVerified && (
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-400/40 text-blue-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              {company.description && (
                <p className="text-muted-foreground text-lg mb-4 max-w-3xl">
                  {company.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {company.industry}
                  </span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {company.location}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-yellow-400 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Company Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active Bounties</span>
                  <Target className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-semibold">{company.activeBounties || 0}</p>
              </CardContent>
            </Card>
            
            <Card className="card-glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Issues Resolved</span>
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-semibold">{company.resolvedVulnerabilities || 0}</p>
              </CardContent>
            </Card>
            
            <Card className="card-glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Paid</span>
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-2xl font-semibold text-yellow-400">
                  {currencyFormatter.format(company.totalBountiesPaid || 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Reputation</span>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-semibold">{company.reputation || 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bounties Section */}
      <div className="container-custom py-10">
        <div className="flex items-center gap-3 mb-8">
          <StatusIcon className="w-6 h-6 text-yellow-400" />
          <h2 className="text-3xl font-semibold">
            Bug <span className="text-yellow-400">Bounties</span>
          </h2>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bounties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => {
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
                    ? `No ${statusFilter.toLowerCase()} bounties available.`
                    : "This company hasn't posted any bounties yet."}
                </p>
                <Button asChild className="btn-primary">
                  <Link href="/bounties">Browse All Bounties</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Showing {bounties.length} {statusFilter.toLowerCase()} {bounties.length === 1 ? "bounty" : "bounties"}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {bounties.map((bounty) => (
                <Card
                  key={bounty.id}
                  className="card-glass hover:border-yellow-400/50 transition cursor-pointer group"
                  onClick={() => router.push(`/bounties/${bounty.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className={STATUS_COLORS[bounty.status] || ""}
                          >
                            {bounty.status}
                          </Badge>
                          {(bounty.bountyTypes || []).slice(0, 2).map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="bg-purple-500/10 border-purple-400/40 text-purple-200"
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-yellow-400 transition">
                          {bounty.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {bounty.description}
                        </p>
                      </div>
                    </div>

                    <Separator className="mb-4" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-yellow-400">
                          {currencyFormatter.format(bounty.rewardAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">Max Reward</p>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {bounty._count?.submissions || 0}
                          </span>
                          {bounty.endsAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {dateFormatter.format(new Date(bounty.endsAt))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full mt-4 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                      size="sm"
                    >
                      View Details & Submit →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
