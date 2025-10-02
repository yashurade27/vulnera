'use client'

import { useMemo } from 'react'
import { useAdminStats } from '../data-access/use-admin-stats'
import { AdminPageHeader } from './admin-page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Building2, Coins, Gauge, FileWarning, ShieldCheck, Users } from 'lucide-react'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 9,
})

const integerFormatter = new Intl.NumberFormat('en-US')

export function AdminOverviewPage() {
  const { data, isLoading, isError } = useAdminStats()

  const overviewCards = useMemo(() => {
    if (!data) return []

    return [
      {
        label: 'Total Users',
        value: integerFormatter.format(data.overview.totalUsers),
        icon: Users,
      },
      {
        label: 'Total Companies',
        value: integerFormatter.format(data.overview.totalCompanies),
        icon: Building2,
      },
      {
        label: 'Active Bounties',
        value: integerFormatter.format(data.overview.activeBounties),
        icon: ShieldCheck,
      },
      {
        label: 'Resolved Vulnerabilities',
        value: integerFormatter.format(data.overview.resolvedVulnerabilities),
        icon: Gauge,
      },
    ]
  }, [data])

  const breakdownRows = useMemo(() => {
    if (!data) return []

    return [
      {
        title: 'User Roles',
        items: [
          { label: 'Bounty Hunters', value: data.userBreakdown.bountyHunters },
          { label: 'Company Admins', value: data.userBreakdown.companyAdmins },
          { label: 'Admins', value: data.userBreakdown.admins },
        ],
      },
      {
        title: 'Companies',
        items: [
          { label: 'Verified', value: data.companyBreakdown.verified },
          { label: 'Unverified', value: data.companyBreakdown.unverified },
        ],
      },
      {
        title: 'Bounties',
        items: [
          { label: 'Active', value: data.bountyBreakdown.active },
          { label: 'Closed', value: data.bountyBreakdown.closed },
          { label: 'Expired', value: data.bountyBreakdown.expired },
        ],
      },
      {
        title: 'Submissions',
        items: [
          { label: 'Pending', value: data.submissionBreakdown.pending },
          { label: 'Approved', value: data.submissionBreakdown.approved },
          { label: 'Rejected', value: data.submissionBreakdown.rejected },
          { label: 'Needs Info', value: data.submissionBreakdown.needsMoreInfo },
        ],
      },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform Overview"
        description="Monitor platform growth, engagement metrics, and financial performance."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border border-border/40 bg-card/40">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="mt-4 h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to load stats</CardTitle>
            <CardDescription>Refresh the page or try again in a moment.</CardDescription>
          </CardHeader>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="border border-border/40 bg-card/40">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <div>
                      <CardDescription>{card.label}</CardDescription>
                      <CardTitle className="text-2xl font-semibold">{card.value}</CardTitle>
                    </div>
                    <span className="rounded-full bg-primary/10 p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 border border-border/40 bg-card/40">
              <CardHeader>
                <CardTitle>Financial Snapshot</CardTitle>
                <CardDescription>Totals aggregated across all approved payments and bounty rewards.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/40 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <Coins className="h-4 w-4 text-yellow-400" />
                  </div>
                  <p className="mt-2 text-xl font-semibold">
                    {currencyFormatter.format(data.overview.totalPayments)} SOL
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total Bounty Rewards</p>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="mt-2 text-xl font-semibold">
                    {currencyFormatter.format(data.overview.totalBountyRewards)} SOL
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <FileWarning className="h-4 w-4 text-sky-400" />
                  </div>
                  <p className="mt-2 text-xl font-semibold">
                    {integerFormatter.format(data.overview.totalSubmissions)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Active Companies</p>
                    <Building2 className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="mt-2 text-xl font-semibold">
                    {integerFormatter.format(data.overview.totalCompanies)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card/40">
              <CardHeader>
                <CardTitle>Report Status</CardTitle>
                <CardDescription>Track moderation workload at a glance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <BreakdownBadge label="Pending" value={data.submissionBreakdown.pending} tone="amber" />
                <BreakdownBadge label="Approved" value={data.submissionBreakdown.approved} tone="emerald" />
                <BreakdownBadge label="Rejected" value={data.submissionBreakdown.rejected} tone="rose" />
                <BreakdownBadge label="Needs Info" value={data.submissionBreakdown.needsMoreInfo} tone="sky" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {breakdownRows.map((group) => (
              <Card key={group.title} className="border border-border/40 bg-card/30">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{integerFormatter.format(item.value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

type BreakdownTone = 'amber' | 'emerald' | 'rose' | 'sky'

function BreakdownBadge({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: BreakdownTone
}) {
  const badgeClasses: Record<BreakdownTone, string> = {
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    emerald: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    rose: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
    sky: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className={badgeClasses[tone]}>
        {integerFormatter.format(value)}
      </Badge>
    </div>
  )
}
