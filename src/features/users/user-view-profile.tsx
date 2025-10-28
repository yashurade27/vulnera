'use client'

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Calendar,
  Coins,
  Github,
  Globe,
  MapPin,
  ShieldCheck,
  Star,
  Trophy,
  Twitter,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCard } from '@/components/ui/project-card'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 9,
})

const integerFormatter = new Intl.NumberFormat('en-US')

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

type UserRole = 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN'

interface PublicUser {
  id: string
  username: string
  fullName: string | null
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

interface SubmissionApiResponse {
  id: string
  title: string
  status: string
  submittedAt: string
  createdAt: string
  rewardAmount: number
  bounty: {
    id: string
    title: string
    rewardAmount: number
  }
  company?: {
    id: string
    name: string
  }
}

interface ProjectSummary {
  id: string
  name: string
  description: string | null
  website: string | null
  createdAt: string
  updatedAt: string
}

interface UserViewProfileProps {
  userId: string
}

export function UserViewProfile({ userId }: UserViewProfileProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<PublicUser | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionSummary[]>([])
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const [userRes, statsRes] = await Promise.all([
          fetch(`/api/users/${userId}`, { credentials: 'include' }),
          fetch(`/api/users/${userId}/stats`, { credentials: 'include' }),
        ])

        if (!userRes.ok) {
          throw new Error('Unable to load user profile')
        }
        if (!statsRes.ok) {
          throw new Error('Unable to load user stats')
        }

        const userPayload = await userRes.json()
        const statsPayload = await statsRes.json()

        const mappedUser: PublicUser = {
          id: userPayload?.user?.id,
          username: userPayload?.user?.username ?? 'user',
          fullName: userPayload?.user?.fullName ?? null,
          bio: userPayload?.user?.bio ?? null,
          avatarUrl: userPayload?.user?.avatarUrl ?? null,
          country: userPayload?.user?.country ?? null,
          role: userPayload?.user?.role ?? 'BOUNTY_HUNTER',
          totalEarnings: Number(userPayload?.user?.totalEarnings ?? 0),
          totalBounties: Number(userPayload?.user?.totalBounties ?? 0),
          reputation: Number(userPayload?.user?.reputation ?? 0),
          rank: userPayload?.user?.rank ?? null,
          githubUrl: userPayload?.user?.githubUrl ?? null,
          twitterUrl: userPayload?.user?.twitterUrl ?? null,
          linkedinUrl: userPayload?.user?.linkedinUrl ?? null,
          portfolioUrl: userPayload?.user?.portfolioUrl ?? null,
          createdAt: userPayload?.user?.createdAt ?? undefined,
        }

        const mappedStats: UserStats = {
          totalEarnings: Number(statsPayload?.stats?.totalEarnings ?? 0),
          totalBounties: Number(statsPayload?.stats?.totalBounties ?? 0),
          reputation: Number(statsPayload?.stats?.reputation ?? 0),
          rank: statsPayload?.stats?.rank ?? null,
          approvedSubmissions: Number(statsPayload?.stats?.approvedSubmissions ?? 0),
          averageReward: Number(statsPayload?.stats?.averageReward ?? 0),
        }

        if (cancelled) {
          return
        }

        setUser(mappedUser)
        setStats(mappedStats)

        // Load projects if bounty hunter
        if (mappedUser.role === 'BOUNTY_HUNTER') {
          setProjectsLoading(true)
          const projectsRes = await fetch(`/api/users/${userId}/projects`, {
            credentials: 'include',
          })

          if (projectsRes.ok) {
            const projectsPayload = await projectsRes.json()
            if (!cancelled) {
              setProjects(projectsPayload?.projects ?? [])
            }
          }
          setProjectsLoading(false)
        }

        // Load recent submissions if bounty hunter
        if (mappedUser.role === 'BOUNTY_HUNTER') {
          const submissionsRes = await fetch(`/api/users/${userId}/submissions?status=APPROVED&limit=6`, {
            credentials: 'include',
          })

          if (submissionsRes.ok) {
            const submissionsPayload = await submissionsRes.json()
            if (!cancelled) {
              const mappedSubmissions: SubmissionSummary[] = Array.isArray(submissionsPayload?.submissions)
                ? submissionsPayload.submissions.map((submission: SubmissionApiResponse) => ({
                    id: submission?.id,
                    title: submission?.title ?? 'Submission',
                    status: submission?.status ?? 'PENDING',
                    submittedAt: submission?.submittedAt ?? submission?.createdAt ?? new Date().toISOString(),
                    rewardAmount: Number(submission?.rewardAmount ?? submission?.bounty?.rewardAmount ?? 0),
                    bounty: {
                      id: submission?.bounty?.id ?? '',
                      title: submission?.bounty?.title ?? 'Bounty',
                      rewardAmount: Number(submission?.bounty?.rewardAmount ?? 0),
                    },
                    company: submission?.company
                      ? {
                          id: submission.company.id,
                          name: submission.company.name ?? '',
                        }
                      : null,
                  }))
                : []

              setRecentSubmissions(mappedSubmissions)
            }
          }
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unexpected error loading profile')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [userId])

  const socialLinks = useMemo(() => {
    if (!user) {
      return []
    }

    const links: Array<{ href: string; label: string; icon: ReactElement }> = []

    if (user.githubUrl) {
      links.push({ href: user.githubUrl, label: 'GitHub', icon: <Github className="w-4 h-4" /> })
    }
    if (user.twitterUrl) {
      links.push({ href: user.twitterUrl, label: 'Twitter', icon: <Twitter className="w-4 h-4" /> })
    }
    if (user.linkedinUrl) {
      links.push({ href: user.linkedinUrl, label: 'LinkedIn', icon: <BadgeCheck className="w-4 h-4" /> })
    }
    if (user.portfolioUrl) {
      links.push({ href: user.portfolioUrl, label: 'Portfolio', icon: <Globe className="w-4 h-4" /> })
    }

    return links
  }, [user])

  const hunterBadges = useMemo(() => {
    if (!user || !stats || user.role !== 'BOUNTY_HUNTER') {
      return []
    }

    const items: Array<{ title: string; description: string }> = []

    if (stats.totalEarnings >= 10_000) {
      items.push({ title: 'Elite Earner', description: 'Secured over $10k in rewards' })
    }
    if (stats.approvedSubmissions >= 25) {
      items.push({ title: 'Seasoned Hunter', description: '25+ approved submissions' })
    }
    if (user.reputation >= 500) {
      items.push({ title: 'Community Pillar', description: 'Top-tier reputation score' })
    }
    if (stats.rank && stats.rank <= 10) {
      items.push({ title: 'Top 10 Hunter', description: 'Elite leaderboard position' })
    }
    if (items.length === 0) {
      items.push({ title: 'Rising Talent', description: 'Actively growing on Vulnera' })
    }

    return items
  }, [stats, user])

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
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container-custom">{renderLoading()}</div>
      </div>
    )
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
      {/* Profile Header */}
      <div className=" border-b border-border bg-card/40 bg-neutral-100 dark:bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 border border-yellow-500/30">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName ?? user.username} /> : null}
                <AvatarFallback className="bg-yellow-500/10 text-yellow-200 text-xl font-semibold">
                  {(user.fullName ?? user.username ?? 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-semibold">{user.fullName ?? `@${user.username}`}</h1>
                  <Badge variant="outline" className="border-yellow-400/40 bg-yellow-500/10 text-yellow-200">
                    {user.role === 'COMPANY_ADMIN'
                      ? 'Company Admin'
                      : user.role === 'ADMIN'
                        ? 'Admin'
                        : 'Bounty Hunter'}
                  </Badge>
                  {user.rank ? (
                    <Badge variant="secondary" className="gap-1">
                      <Trophy className="w-3 h-3" /> Rank #{user.rank}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {user.bio ?? 'This user has not added a bio yet.'}
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
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
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
              <p className="text-3xl font-semibold">
                {integerFormatter.format(stats?.totalBounties ?? user.totalBounties ?? 0)}
              </p>
              <span className="text-xs text-muted-foreground">Successful bounty hunts</span>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reputation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {integerFormatter.format(stats?.reputation ?? user.reputation ?? 0)}
              </p>
              <span className="text-xs text-muted-foreground">Community trust score</span>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Reward</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{currencyFormatter.format(stats?.averageReward ?? 0)} SOL</p>
              <span className="text-xs text-muted-foreground">Per approved submission</span>
            </CardContent>
          </Card>
        </section>

        {/* Bounty Hunter Specific Content */}
        {user.role === 'BOUNTY_HUNTER' ? (
          <section className="grid lg:grid-cols-[2fr_1fr] gap-8">
            {/* Recent Submissions */}
            <Card className="card-glass">
              <CardHeader>
                <div>
                  <CardTitle className="text-2xl">Recent Successful Submissions</CardTitle>
                  <p className="text-sm text-muted-foreground">Latest approved reports from this hunter</p>
                </div>
              </CardHeader>
              <CardContent>
                {recentSubmissions.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No approved submissions yet.</div>
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
                          {submission.company ? ` · ${submission.company.name}` : ''}
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

            {/* Badges */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-2xl">Achievements</CardTitle>
                <p className="text-sm text-muted-foreground">Recognition earned through consistent performance</p>
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

        {/* Proof of Work Section for Bounty Hunters */}
        {user.role === 'BOUNTY_HUNTER' ? (
          <section>
            <Card className="card-glass">
              <CardHeader>
                <div>
                  <CardTitle className="text-2xl">Proof of Work</CardTitle>
                  <p className="text-sm text-muted-foreground">Projects and achievements showcased by this hunter</p>
                </div>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    This hunter hasn&apos;t added any projects yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project, index) => (
                      <ProjectCard key={project.id} project={project} gradientIndex={index} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* Performance Stats for Company Admins */}
        {user.role === 'COMPANY_ADMIN' ? (
          <section>
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-2xl">Company Profile</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This user manages company bounty programs. Visit their company page for more details.
                </p>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Company administrators help secure blockchain projects through bug bounty programs.
                </p>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </div>
    </div>
  )
}

