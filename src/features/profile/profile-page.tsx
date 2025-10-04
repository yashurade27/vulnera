"use client"

import { useEffect, useMemo, useState, type ReactElement } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  Coins,
  ExternalLink,
  Github,
  Globe,
  MapPin,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Twitter,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 9,
})

const integerFormatter = new Intl.NumberFormat("en-US")

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

type UserRole = "BOUNTY_HUNTER" | "COMPANY_ADMIN" | "ADMIN"

interface ProfileUser {
  id: string
  username: string
  fullName: string | null
  email: string
  bio: string | null
  avatarUrl: string | null
  country: string | null
  role: UserRole
  totalEarnings: number
  totalBounties: number
  reputation: number
  rank: number | null
  githubUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  portfolioUrl?: string | null
  createdAt?: string
}

interface UserStats {
  totalEarnings: number
  totalBounties: number
  reputation: number
  rank: number | null
  approvedSubmissions: number
  averageReward: number
}

interface SubmissionSummary {
  id: string
  title: string
  status: string
  submittedAt: string
  rewardAmount: number
  bounty: {
    id: string
    title: string
    rewardAmount: number
  }
  company: {
    id: string
    name: string
  } | null
}

interface CompanyMembershipSummary {
  role: UserRole
  canCreateBounty: boolean
  canReviewBounty: boolean
  canApprovePayment: boolean
  canManageMembers: boolean
  invitedAt: string | null
  joinedAt: string | null
  company: CompanyProfile | null
}

interface CompanyProfile {
  id: string
  name: string
  slug: string
  description: string | null
  website: string | null
  logoUrl: string | null
  walletAddress: string
  smartContractAddress: string | null
  industry: string | null
  companySize: string | null
  location: string | null
  isVerified: boolean
  isActive: boolean
  totalBountiesFunded: number
  totalBountiesPaid: number
  activeBounties: number
  resolvedVulnerabilities: number
  createdAt: string
  _count?: {
    bounties: number
    members: number
  }
}

interface CompanyStatsOverview {
  totalBounties: number
  activeBounties: number
  totalBountiesFunded: number
  totalPaidOut: number
  approvedSubmissions: number
  totalRewardsPaid: number
  totalSubmissions: number
  activeMembers: number
}

interface CompanyStatsPayload {
  overview: CompanyStatsOverview
}

interface CompanyBountySummary {
  id: string
  title: string
  bountyType: string
  rewardAmount: number
  status: string
  createdAt?: string
  endsAt?: string | null
  _count?: {
    submissions: number
  }
}

interface ProfilePageProps {
  userId: string
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionSummary[]>([])
  const [memberships, setMemberships] = useState<CompanyMembershipSummary[]>([])
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [companyStats, setCompanyStats] = useState<CompanyStatsOverview | null>(null)
  const [companyBounties, setCompanyBounties] = useState<CompanyBountySummary[]>([])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const userPayload = {
          user: {
            id: userId,
            username: "johndoe",
            fullName: "John Doe",
            email: "john.doe@example.com",
            bio: "A passionate bug bounty hunter.",
            avatarUrl: null,
            country: "USA",
            role: "BOUNTY_HUNTER",
            totalEarnings: 1500,
            totalBounties: 5,
            reputation: 100,
            rank: 1,
            githubUrl: "https://github.com/johndoe",
            twitterUrl: "https://twitter.com/johndoe",
            linkedinUrl: null,
            portfolioUrl: null,
            createdAt: new Date().toISOString(),
          },
        };

        const statsPayload = {
          stats: {
            totalEarnings: 1500,
            totalBounties: 5,
            reputation: 100,
            rank: 1,
            approvedSubmissions: 5,
            averageReward: 300,
          },
        };

        const mappedUser: ProfileUser = {
          id: userPayload?.user?.id,
          username: userPayload?.user?.username ?? "user",
          fullName: userPayload?.user?.fullName ?? null,
          email: userPayload?.user?.email ?? "",
          bio: userPayload?.user?.bio ?? null,
          avatarUrl: userPayload?.user?.avatarUrl ?? null,
          country: userPayload?.user?.country ?? null,
          role: userPayload?.user?.role ?? "BOUNTY_HUNTER",
          totalEarnings: Number(userPayload?.user?.totalEarnings ?? 0),
          totalBounties: Number(userPayload?.user?.totalBounties ?? 0),
          reputation: Number(userPayload?.user?.reputation ?? 0),
          rank: userPayload?.user?.rank ?? null,
          githubUrl: userPayload?.user?.githubUrl ?? null,
          twitterUrl: userPayload?.user?.twitterUrl ?? null,
          linkedinUrl: userPayload?.user?.linkedinUrl ?? null,
          portfolioUrl: userPayload?.user?.portfolioUrl ?? null,
          createdAt: userPayload?.user?.createdAt ?? undefined,
        };

        const mappedStats: UserStats = {
          totalEarnings: Number(statsPayload?.stats?.totalEarnings ?? 0),
          totalBounties: Number(statsPayload?.stats?.totalBounties ?? 0),
          reputation: Number(statsPayload?.stats?.reputation ?? 0),
          rank: statsPayload?.stats?.rank ?? null,
          approvedSubmissions: Number(statsPayload?.stats?.approvedSubmissions ?? 0),
          averageReward: Number(statsPayload?.stats?.averageReward ?? 0),
        };

        setUser(mappedUser);
        setStats(mappedStats);

        if (mappedUser.role === "BOUNTY_HUNTER") {
          const submissionsPayload = {
            submissions: [
              {
                id: "sub_1",
                title: "XSS in Profile Page",
                status: "APPROVED",
                submittedAt: new Date().toISOString(),
                rewardAmount: 500,
                bounty: { id: "bounty_1", title: "Harden Profile Security", rewardAmount: 500 },
                company: { id: "comp_1", name: "TechCorp" },
              },
            ],
          };
          const mappedSubmissions: SubmissionSummary[] = Array.isArray(submissionsPayload?.submissions)
            ? submissionsPayload.submissions.map((submission: any) => ({
                id: submission?.id,
                title: submission?.title ?? "Submission",
                status: submission?.status ?? "PENDING",
                submittedAt: submission?.submittedAt ?? submission?.createdAt ?? new Date().toISOString(),
                rewardAmount: Number(submission?.rewardAmount ?? submission?.bounty?.rewardAmount ?? 0),
                bounty: {
                  id: submission?.bounty?.id ?? submission?.bountyId ?? "",
                  title: submission?.bounty?.title ?? "Bounty",
                  rewardAmount: Number(submission?.bounty?.rewardAmount ?? 0),
                },
                company: submission?.company
                  ? {
                      id: submission.company.id,
                      name: submission.company.name ?? "",
                    }
                  : null,
              }))
            : [];
          setRecentSubmissions(mappedSubmissions);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unexpected error loading profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true
    }
  }, [userId])

  const isOwnProfile = session?.user?.id === user?.id

  const socialLinks = useMemo(() => {
    if (!user) {
      return []
    }

  const links: Array<{ href: string; label: string; icon: ReactElement }> = []

    if (user.githubUrl) {
      links.push({ href: user.githubUrl, label: "GitHub", icon: <Github className="w-4 h-4" /> })
    }
    if (user.twitterUrl) {
      links.push({ href: user.twitterUrl, label: "Twitter", icon: <Twitter className="w-4 h-4" /> })
    }
    if (user.linkedinUrl) {
      links.push({ href: user.linkedinUrl, label: "LinkedIn", icon: <BadgeCheck className="w-4 h-4" /> })
    }
    if (user.portfolioUrl) {
      links.push({ href: user.portfolioUrl, label: "Portfolio", icon: <Globe className="w-4 h-4" /> })
    }

    return links
  }, [user])

  const hunterBadges = useMemo(() => {
    if (!user || !stats || user.role !== "BOUNTY_HUNTER") {
      return []
    }

    const items: Array<{ title: string; description: string }> = []

    if (stats.totalEarnings >= 10_000) {
      items.push({ title: "Elite Earner", description: "Secured over $10k in rewards" })
    }
    if (stats.approvedSubmissions >= 25) {
      items.push({ title: "Seasoned Hunter", description: "25+ approved submissions" })
    }
    if (user.reputation >= 500) {
      items.push({ title: "Community Pillar", description: "Top-tier reputation score" })
    }
    if (items.length === 0) {
      items.push({ title: "Rising Talent", description: "Actively growing on Vulnera" })
    }

    return items
  }, [stats, user])

  const companyBadges = useMemo(() => {
    if (!company || !companyStats) {
      return []
    }

    const items: Array<{ title: string; description: string }> = []

    if (companyStats.totalBounties >= 10) {
      items.push({ title: "Program Innovator", description: "Launched 10+ bounty programs" })
    }
    if (companyStats.totalPaidOut >= 50_000) {
      items.push({ title: "Security Champion", description: "Invested $50k+ in rewards" })
    }
    if (companyStats.approvedSubmissions >= 100) {
      items.push({ title: "Bug Crusher", description: "Closed 100+ valid reports" })
    }
    if (items.length === 0) {
      items.push({ title: "Trusted Partner", description: "Building trust with the community" })
    }

    return items
  }, [company, companyStats])

  const renderLoading = () => (
    <div className="space-y-6">
      <Card className="card-glass">
        <CardContent className="p-6 flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="card-glass">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-2/5 mb-3" />
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return <div className="min-h-screen bg-background py-12"><div className="container-custom">{renderLoading()}</div></div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container-custom max-w-lg">
          <Card className="card-glass border border-red-500/30">
            <CardContent className="p-8 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 border border-yellow-500/30">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName ?? user.username} /> : null}
                <AvatarFallback className="bg-yellow-500/10 text-yellow-200 text-xl font-semibold">
                  {(user.fullName ?? user.username ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-semibold">
                    {user.fullName ?? `@${user.username}`}
                  </h1>
                  <Badge variant="outline" className="border-yellow-400/40 bg-yellow-500/10 text-yellow-200">
                    {user.role === "COMPANY_ADMIN" ? "Company Admin" : user.role === "ADMIN" ? "Admin" : "Bounty Hunter"}
                  </Badge>
                  {user.rank ? (
                    <Badge variant="secondary" className="gap-1">
                      <Trophy className="w-3 h-3" /> Rank #{user.rank}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {user.bio ?? "This user has not added a bio yet."}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                  <span>@{user.username}</span>
                  {user.country ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.country}
                    </span>
                  ) : null}
                  {user.createdAt ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Joined {dateFormatter.format(new Date(user.createdAt))}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <Button key={link.href} variant="ghost" size="icon" asChild>
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                    {link.icon}
                  </Link>
                </Button>
              ))}
              {isOwnProfile ? (
                <Button asChild variant="outline">
                  <Link href="/settings">
                    Manage Profile
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-10 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-yellow-400">
                {currencyFormatter.format(stats?.totalEarnings ?? user.totalEarnings ?? 0)} SOL
              </p>
              <span className="text-xs text-muted-foreground">Approved bounty rewards</span>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Bounties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{integerFormatter.format(stats?.totalBounties ?? user.totalBounties ?? 0)}</p>
              <span className="text-xs text-muted-foreground">Successful bounty hunts</span>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reputation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{integerFormatter.format(stats?.reputation ?? user.reputation ?? 0)}</p>
              <span className="text-xs text-muted-foreground">Community trust score</span>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {currencyFormatter.format(stats?.averageReward ?? 0)} SOL
              </p>
              <span className="text-xs text-muted-foreground">Per approved submission</span>
            </CardContent>
          </Card>
        </section>

        {user.role === "BOUNTY_HUNTER" ? (
          <section className="grid lg:grid-cols-[2fr_1fr] gap-8">
            <Card className="card-glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Recent Successful Submissions</CardTitle>
                  <p className="text-sm text-muted-foreground">Latest approved reports from this hunter</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/submissions?userId=${user.id}`}>View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentSubmissions.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No approved submissions yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="p-4 border border-border rounded-xl hover:border-yellow-400/50 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-yellow-300">
                            {submission.title}
                          </h3>
                          <Badge variant="outline" className="border-green-500/40 text-green-300 bg-green-500/10">
                            {submission.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Submitted on {dateFormatter.format(new Date(submission.submittedAt))}
                          {submission.company ? ` · ${submission.company.name}` : ""}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-yellow-300 font-semibold">
                            <Coins className="w-4 h-4" />
                            {currencyFormatter.format(submission.rewardAmount)} SOL
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/submissions/${submission.id}`} className="flex items-center gap-1 text-xs">
                              View details <ArrowRight className="w-3 h-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-2xl">Badges</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Recognition unlocked through consistent performance
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {hunterBadges.map((badge) => (
                  <div key={badge.title} className="border border-border rounded-xl p-4 flex gap-3">
                    <Award className="w-5 h-5 text-yellow-300 mt-1" />
                    <div>
                      <p className="font-semibold">{badge.title}</p>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}

        {user.role === "COMPANY_ADMIN" && company ? (
          <section className="space-y-8">
            <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
              <Card className="card-glass relative overflow-hidden">
                <CardContent className="p-6 flex flex-col lg:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <Avatar className="h-20 w-20 rounded-xl border border-yellow-500/50">
                      {company.logoUrl ? <AvatarImage src={company.logoUrl} alt={company.name} /> : null}
                      <AvatarFallback className="bg-yellow-500/10 text-yellow-200 text-xl font-semibold">
                        {company.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-semibold">{company.name}</h2>
                      {company.isVerified ? (
                        <Badge variant="outline" className="border-green-400/40 text-green-300 bg-green-500/10 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </Badge>
                      ) : null}
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {company.industry ?? "Industry"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {company.description ?? "This company has not added a description yet."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {company.website ? (
                        <Link href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 link-premium">
                          <ExternalLink className="w-4 h-4" /> Visit website
                        </Link>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {integerFormatter.format(company._count?.members ?? companyStats?.activeMembers ?? 0)} members
                      </span>
                      {company.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {company.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-xl">Company Badges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyBadges.map((badge) => (
                    <div key={badge.title} className="border border-border rounded-lg p-3 text-sm">
                      <p className="font-semibold flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-300" /> {badge.title}
                      </p>
                      <p className="text-muted-foreground mt-1">{badge.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Active Bounties</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{integerFormatter.format(companyStats?.activeBounties ?? company.activeBounties ?? 0)}</p>
                  <span className="text-xs text-muted-foreground">Currently accepting submissions</span>
                </CardContent>
              </Card>
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Funded</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-yellow-300">
                    {currencyFormatter.format(companyStats?.totalBountiesFunded ?? company.totalBountiesFunded ?? 0)} SOL
                  </p>
                  <span className="text-xs text-muted-foreground">Escrowed across programs</span>
                </CardContent>
              </Card>
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Rewards Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">
                    {currencyFormatter.format(companyStats?.totalPaidOut ?? company.totalBountiesPaid ?? 0)} SOL
                  </p>
                  <span className="text-xs text-muted-foreground">Distributed to hunters</span>
                </CardContent>
              </Card>
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Approved Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">
                    {integerFormatter.format(companyStats?.approvedSubmissions ?? 0)}
                  </p>
                  <span className="text-xs text-muted-foreground">Validated vulnerabilities</span>
                </CardContent>
              </Card>
            </div>

            <Card className="card-glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Active Bounties</CardTitle>
                  <p className="text-sm text-muted-foreground">Open opportunities for hunters</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/companies/${company.id}/bounties`}>View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {companyBounties.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No active bounties right now.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {companyBounties.map((bounty) => (
                      <div key={bounty.id} className="border border-border rounded-xl p-4 hover:border-yellow-400/50 transition">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-semibold text-base line-clamp-2">{bounty.title}</h3>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {bounty.bountyType}
                            </Badge>
                          </div>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/bounties/${bounty.id}`} className="flex items-center gap-1 text-xs">
                              Details <ArrowRight className="w-3 h-3" />
                            </Link>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-yellow-300 font-semibold">
                            <Coins className="w-4 h-4" />
                            {currencyFormatter.format(bounty.rewardAmount)} SOL
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Target className="w-3 h-3" />
                            {(bounty._count?.submissions ?? 0).toString()} submissions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {memberships.length > 1 ? (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="text-xl">Other Memberships</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {memberships
                    .filter((membership) => membership.company && membership.company.id !== company.id)
                    .map((membership) => (
                      <div key={membership.company?.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{membership.company?.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" /> {integerFormatter.format(membership.company?._count?.members ?? 0)} members
                            </p>
                          </div>
                          <Badge variant="secondary">{membership.role}</Badge>
                        </div>
                        <Link
                          href={`/profile/${userId}?company=${membership.company?.id}`}
                          className="text-sm link-premium"
                        >
                          View profile <ArrowRight className="w-3 h-3 inline" />
                        </Link>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
