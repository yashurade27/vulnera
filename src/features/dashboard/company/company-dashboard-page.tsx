'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Inbox,
  Plus,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react'

interface CompanySummary {
  id: string
  name: string
  walletAddress?: string | null
  isVerified: boolean
  isActive?: boolean
}

interface CompanyStatsData {
  activeBounties: number
  pendingSubmissions: number
  totalPaid: number
  totalSubmissions: number
}

interface BountyItem {
  id: string
  title: string
  bountyTypes: string[]
  rewardAmount: number
  submissionsCount: number
  endsAt: string | null
}

interface SubmissionItem {
  id: string
  title: string
  status: string
  createdAt: string
  bounty: {
    id: string
    title: string
    bountyTypes: string[]
  }
  hunter: {
    id: string
    username: string
  }
}

const BOUNTY_TYPE_COLORS: Record<string, string> = {
  UI: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  FUNCTIONALITY: 'bg-green-500/10 text-green-400 border-green-500/30',
  PERFORMANCE: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  SECURITY: 'bg-red-500/10 text-red-400 border-red-500/30',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  APPROVED: 'bg-green-500/10 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30',
  DUPLICATE: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  SPAM: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  NEEDS_MORE_INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function CompanyDashboardPage() {
  const router = useRouter()
  const [company, setCompany] = useState<CompanySummary | null>(null)
  const [stats, setStats] = useState<CompanyStatsData | null>(null)
  const [bounties, setBounties] = useState<BountyItem[]>([])
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [awaitingVerification, setAwaitingVerification] = useState(false)

  useEffect(() => {
    let active = true

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const companyPayload = {
          company: {
            id: "comp_123",
            name: "Vulnera Inc.",
            walletAddress: "So11111111111111111111111111111111111111112",
            isVerified: true,
            isActive: true,
          },
        };
        const companyData: CompanySummary | undefined = companyPayload?.company;
        if (!companyData?.id) {
          throw new Error("No company found for current user");
        }

        setCompany(companyData);
        setAwaitingVerification(!companyData.isVerified);

        const statsJson = {
          stats: {
            overview: {
              activeBounties: 5,
              totalRewardsPaid: 50000,
              totalSubmissions: 100,
            },
            submissionBreakdown: [{ status: "PENDING", _count: 10 }],
          },
        };
        const overview = statsJson?.stats?.overview ?? {};
        const submissionBreakdown: Array<{ status: string; count: number }> = (
          statsJson?.stats?.submissionBreakdown ?? []
        ).map((item: any) => ({
          status: item?.status,
          count: Number(item?._count ?? item?.count ?? 0),
        }));
        const pendingSubmissionCount = submissionBreakdown.find((item) => item.status === "PENDING")?.count ?? 0;

        setStats({
          activeBounties: Number(overview?.activeBounties ?? 0),
          pendingSubmissions: pendingSubmissionCount,
          totalPaid: Number(overview?.totalRewardsPaid ?? 0),
          totalSubmissions: Number(overview?.totalSubmissions ?? 0),
        });

        const bountiesJson = {
          bounties: [
            {
              id: "bounty_1",
              title: "Fix Authentication Flow",
              bountyTypes: ["SECURITY"],
              rewardAmount: 1500,
              _count: { submissions: 10 },
              endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "bounty_2",
              title: "Improve Dashboard Performance",
              bountyTypes: ["PERFORMANCE"],
              rewardAmount: 750,
              _count: { submissions: 5 },
              endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        };
        const mappedBounties: BountyItem[] = Array.isArray(bountiesJson?.bounties)
          ? bountiesJson.bounties.map((bounty: any) => ({
              id: bounty?.id,
              title: bounty?.title ?? "Untitled bounty",
              bountyTypes:
                Array.isArray(bounty?.bountyTypes) && bounty.bountyTypes.length
                  ? bounty.bountyTypes
                  : [bounty?.bountyType ?? "UI"],
              rewardAmount: Number(bounty?.rewardAmount ?? 0),
              submissionsCount: Number(bounty?._count?.submissions ?? 0),
              endsAt: bounty?.endsAt ?? null,
            }))
          : [];
        setBounties(mappedBounties);

        const submissionsJson = {
          submissions: [
            {
              id: "sub_1",
              title: "XSS in Profile Page",
              status: "PENDING",
              submittedAt: new Date().toISOString(),
              bounty: { id: "bounty_1", title: "Fix Authentication Flow", bountyTypes: ["SECURITY"] },
              user: { id: "user_1", username: "hunter1" },
            },
            {
              id: "sub_2",
              title: "CSRF in Settings",
              status: "PENDING",
              submittedAt: new Date().toISOString(),
              bounty: { id: "bounty_2", title: "Improve Dashboard Performance", bountyTypes: ["PERFORMANCE"] },
              user: { id: "user_2", username: "hunter2" },
            },
          ],
        };
        const mappedSubmissions: SubmissionItem[] = Array.isArray(submissionsJson?.submissions)
          ? submissionsJson.submissions.map((submission: any) => ({
              id: submission?.id,
              title: submission?.title ?? "Submission",
              status: submission?.status ?? "PENDING",
              createdAt: submission?.submittedAt ?? submission?.createdAt ?? new Date().toISOString(),
              bounty: {
                id: submission?.bounty?.id ?? submission?.bountyId ?? "",
                title: submission?.bounty?.title ?? "Bounty",
                bountyTypes:
                  Array.isArray(submission?.bounty?.bountyTypes) && submission.bounty.bountyTypes.length
                    ? submission.bounty.bountyTypes
                    : submission?.bountyType
                    ? [submission.bountyType]
                    : ["UI"],
              },
              hunter: {
                id: submission?.user?.id ?? submission?.hunter?.id ?? "",
                username: submission?.user?.username ?? submission?.hunter?.username ?? "hunter",
              },
            }))
          : [];
        setSubmissions(mappedSubmissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();

    return () => {
      active = false
    }
  }, [])

  const statBlocks = useMemo(() => {
    return [
      {
        label: 'Active Bounties',
        value: stats?.activeBounties ?? 0,
        icon: FileText,
        helper: 'Currently running',
      },
      {
        label: 'Pending Reviews',
        value: stats?.pendingSubmissions ?? 0,
        icon: Clock,
        helper: 'Awaiting action',
      },
      {
        label: 'Total Paid',
        value: stats ? currencyFormatter.format(stats.totalPaid) : currencyFormatter.format(0),
        icon: DollarSign,
        helper: 'All-time rewards',
        highlight: true,
      },
      {
        label: 'Total Submissions',
        value: stats?.totalSubmissions ?? 0,
        icon: TrendingUp,
        helper: 'Bugs reported',
      },
    ]
  }, [stats])

  const firstFundableBountyIds = useMemo(() => {
    const seenCategories = new Set<string>()
    const allowedIds = new Set<string>()

    bounties.forEach((bounty) => {
      const categoryKey = bounty.bountyTypes && bounty.bountyTypes.length > 0 ? bounty.bountyTypes[0] : 'UNCATEGORIZED'

      if (!seenCategories.has(categoryKey)) {
        seenCategories.add(categoryKey)
        allowedIds.add(bounty.id)
      }
    })

    return allowedIds
  }, [bounties])

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-xl w-full card-glass">
          <CardHeader className="space-y-3 text-center">
            <Badge
              variant="outline"
              className="bg-yellow-500/10 border-yellow-400/40 text-yellow-200 inline-flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" /> Welcome to Vulnera
            </Badge>
            <CardTitle className="text-3xl">Complete your company profile</CardTitle>
            <CardDescription>
              We don’t have any company details on file yet. Share a little about your team so we can review and onboard
              you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-yellow-400" /> Fill out your company details, wallet, and optional
                on-chain info.
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" /> Our admins will review and notify you once onboarding is
                complete.
              </p>
              <p className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-yellow-400" /> After approval you’ll be able to fund and launch
                bounties.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900"
                onClick={() => router.push('/onboarding/company')}
              >
                Start onboarding
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
                Go to homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Company Dashboard</h1>
              <p className="text-muted-foreground">
                {company?.name
                  ? `Manage ${company.name} bounties and submissions`
                  : 'Manage your bounties and submissions'}
              </p>
            </div>
            {awaitingVerification ? (
              <div className="flex flex-col gap-2 text-right max-w-sm">
                <Badge variant="outline" className="self-end bg-yellow-500/10 border-yellow-400/40 text-yellow-200">
                  Pending admin review
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Your company profile is waiting for admin approval. You’ll receive a notification once onboarding is
                  complete.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap justify-end">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/company/submissions">
                    <Inbox className="w-4 h-4 mr-2" />
                    Review Submissions
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/company/bounties">
                    <Eye className="w-4 h-4 mr-2" />
                    View All Bounties
                  </Link>
                </Button>
                <Button
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                  asChild
                >
                  <Link href="/dashboard/company/bounties/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Bounty
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-8 space-y-8">
        {awaitingVerification ? (
          <Card className="card-glass border-yellow-400/40 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" /> Admin onboarding in progress
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                We’re reviewing your submission. You won’t be able to fund wallets or create new bounties until approval
                is complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                We usually respond within 1 business day. You’ll be notified via email and the in-app bell once
                approved.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => router.push('/onboarding/company')}>
                  Update company details
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="mailto:support@vulnera.xyz">Contact support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statBlocks.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="card-glass">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  <Icon className="w-5 h-5 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${item.highlight ? 'text-yellow-400' : ''}`}>{item.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{item.helper}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="card-glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Active Bounties</CardTitle>
                    <CardDescription>Your currently running bug bounty programs</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/company/bounties">View All</Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {awaitingVerification ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Finish onboarding to activate bounties</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Once approved you’ll be able to launch and manage bounty programs here.
                    </p>
                    <Button variant="outline" onClick={() => router.push('/onboarding/company')}>
                      Review company details
                    </Button>
                  </div>
                ) : bounties.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No active bounties yet</p>
                    <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900" asChild>
                      <Link href="/dashboard/company/bounties/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Bounty
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bounties.map((bounty) => (
                      <div
                        key={bounty.id}
                        className="p-4 rounded-lg border border-border hover:border-yellow-400/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg line-clamp-2">{bounty.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                {bounty.bountyTypes.map((type) => (
                                  <Badge key={type} variant="outline" className={BOUNTY_TYPE_COLORS[type] ?? ''}>
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400 font-semibold">
                                  {currencyFormatter.format(bounty.rewardAmount)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{bounty.submissionsCount} submissions</span>
                              </div>
                              {bounty.endsAt ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Ends {dateFormatter.format(new Date(bounty.endsAt))}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!firstFundableBountyIds.has(bounty.id)}
                              onClick={() => {
                                if (firstFundableBountyIds.has(bounty.id)) {
                                  router.push(`/bounties/${bounty.id}`)
                                }
                              }}
                            >
                              Fund
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/bounties/${bounty.id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="card-glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Recent Submissions</CardTitle>
                    <CardDescription>Pending review</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/company/submissions">View all</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {awaitingVerification ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Submissions will appear once your company is approved.
                    </p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No pending submissions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="p-4 rounded-lg border border-border hover:border-yellow-400/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm line-clamp-2">{submission.title}</h4>
                          <Badge variant="outline" className={STATUS_COLORS[submission.status] ?? ''}>
                            {submission.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">by @{submission.hunter.username}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex flex-wrap gap-2">
                            {submission.bounty.bountyTypes.map((type) => (
                              <Badge key={type} variant="outline" className={BOUNTY_TYPE_COLORS[type] ?? ''}>
                                {type}
                              </Badge>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                            <Link href={`/dashboard/company/submissions/${submission.id}`}>Review</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
