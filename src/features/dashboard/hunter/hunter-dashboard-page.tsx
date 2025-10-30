"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Trophy,
  Coins,
  Clock,
  Target,
  Rocket,
  ListChecks,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalEarnings: number
  approvedSubmissions: number
  totalBounties: number
  averageReward: number
  reputation: number
}

interface PendingSubmission {
  id: string
  title: string
  status: string
  submittedAt: string
  bountyTitle: string
  companyName?: string
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function HunterDashboardPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      if (!session?.user?.id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)

        const [statsRes, submissionsRes] = await Promise.all([
          fetch(`/api/users/${session.user.id}/stats`, { credentials: "include" }),
          fetch(`/api/users/${session.user.id}/submissions?status=PENDING&limit=5`, { credentials: "include" }),
        ])

        if (!statsRes.ok) {
          throw new Error("Unable to load stats")
        }
        if (!submissionsRes.ok) {
          throw new Error("Unable to load submissions")
        }

        const statsPayload = await statsRes.json()
        const submissionsPayload = await submissionsRes.json()

        setStats({
          totalEarnings: Number(statsPayload?.stats?.totalEarnings ?? 0),
          approvedSubmissions: Number(statsPayload?.stats?.approvedSubmissions ?? 0),
          totalBounties: Number(statsPayload?.stats?.totalBounties ?? 0),
          averageReward: Number(statsPayload?.stats?.averageReward ?? 0),
          reputation: Number(statsPayload?.stats?.reputation ?? 0),
        })

        const mappedSubmissions: PendingSubmission[] = Array.isArray(submissionsPayload?.submissions)
          ? submissionsPayload.submissions.map((submission: any) => ({
              id: submission?.id,
              title: submission?.title ?? "Submission",
              status: submission?.status ?? "PENDING",
              submittedAt: submission?.submittedAt ?? submission?.createdAt ?? new Date().toISOString(),
              bountyTitle: submission?.bounty?.title ?? "Bounty",
              companyName: submission?.company?.name ?? undefined,
            }))
          : []

        setPendingSubmissions(mappedSubmissions)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Unexpected error loading dashboard")
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [session?.user?.id])

  if (status === "loading") {
    return null
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 text-center space-y-4">
              <Rocket className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Sign in to access your hunter dashboard.</p>
              <Button asChild>
                <Link href="/auth/login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className=" border-b border-border bg-card/40 bg-neutral-100 dark:bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-12 space-y-4">
          <Badge variant="outline" className="bg-yellow-500/10 border-yellow-400/40 text-yellow-200 inline-flex items-center gap-2">
            <Rocket className="w-3 h-3" /> Hunter Dashboard
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-semibold flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" /> Welcome back, {session.user.fullName ?? session.user.username ?? session.user.email ?? "Hunter"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your progress, follow up on submissions, and discover new bounties.
          </p>
        </div>
      </div>

      <div className="container-custom py-10 space-y-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="card-glass">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="card-glass border border-red-500/40">
            <CardContent className="p-8 text-center text-muted-foreground">{error}</CardContent>
          </Card>
        ) : (
          <>
            <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-yellow-300">
                    {currencyFormatter.format(stats?.totalEarnings ?? 0)}
                  </p>
                  <span className="text-xs text-muted-foreground">Approved rewards to date</span>
                </CardContent>
              </Card>
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Approved submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stats?.approvedSubmissions ?? 0}</p>
                  <span className="text-xs text-muted-foreground">Winning reports</span>
                </CardContent>
              </Card>
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Average reward</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{currencyFormatter.format(stats?.averageReward ?? 0)}</p>
                  <span className="text-xs text-muted-foreground">Per approved submission</span>
                </CardContent>
              </Card>
              <Card className="card-glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Reputation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stats?.reputation ?? 0}</p>
                  <span className="text-xs text-muted-foreground">Community score</span>
                </CardContent>
              </Card>
            </section>

            <section className="grid lg:grid-cols-[2fr_1fr] gap-8">
              <Card className="card-glass">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Pending reviews</CardTitle>
                    <p className="text-sm text-muted-foreground">Submissions awaiting company feedback</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/submissions?status=PENDING">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {pendingSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ListChecks className="w-10 h-10 mx-auto mb-3" />
                      Nothing pending. Great job!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingSubmissions.map((submission) => (
                        <div key={submission.id} className="p-4 border border-border rounded-xl hover:border-yellow-400/50 transition">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h3 className="font-semibold line-clamp-1">{submission.title}</h3>
                            <Badge variant="outline" className="border-yellow-500/30">
                              {submission.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Submitted {dateFormatter.format(new Date(submission.submittedAt))}
                            {submission.companyName ? ` · ${submission.companyName}` : ""}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Target className="w-3 h-3" /> {submission.bountyTitle}
                            </span>
                            <Button variant="ghost" size="sm" asChild className="text-xs">
                              <Link href={`/submissions/${submission.id}`}>Open <ArrowRight className="w-3 h-3" /></Link>
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
                  <CardTitle className="text-2xl">Next steps</CardTitle>
                  <p className="text-sm text-muted-foreground">Quick links to continue your journey.</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href={`/profile/${session.user.id}`}>
                      View public profile
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href="/leaderboard">
                      Explore leaderboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href="/bounties">
                      Discover bounties
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
