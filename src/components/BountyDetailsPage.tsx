'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useBountiesStore } from '@/stores/bounties-store'

export function BountyDetailsPage({ params }: { params: Promise<{ bountyId: string }> }) {
  const { bountyId } = React.use(params)
  const router = useRouter()
  const { currentBounty, setCurrentBounty, submissions, setSubmissions, loading, setLoading, clearSubmissions } =
    useBountiesStore()
  const [isCompanyMember, setIsCompanyMember] = useState(false)

  const fetchBountyDetails = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bounties/${bountyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bounty details");
      }
      const data = await response.json();
      setCurrentBounty(data);
    } catch (error) {
      console.error('Failed to fetch bounty details:', error)
    } finally {
      setLoading(false)
    }
  }, [bountyId, setCurrentBounty, setLoading])

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch(`/api/bounties/${bountyId}/submissions`);
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data.map((submission: any) => ({
            id: submission?.id,
            title: submission?.title ?? 'Submission',
            status: submission?.status ?? 'PENDING',
            createdAt: submission?.createdAt ?? submission?.submittedAt ?? new Date().toISOString(),
            reporter: {
              displayName:
                submission?.user?.fullName ??
                submission?.user?.username ??
                'Anonymous Hunter',
              username: submission?.user?.username ?? null,
            },
          }))
        : []
      setSubmissions(normalized)
      // TODO: Replace with actual logic to check if the user is a company member
      setIsCompanyMember(true)
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    }
  }, [bountyId, setSubmissions])

  useEffect(() => {
    clearSubmissions()
    setIsCompanyMember(false)
  }, [bountyId, clearSubmissions])

  useEffect(() => {
    fetchBountyDetails()
  }, [fetchBountyDetails])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading bounty details...</div>
      </div>
    )
  }

  if (!currentBounty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Bounty not found</h2>
          <p className="text-muted-foreground mb-4">The bounty you're looking for doesn't exist</p>
          <Button onClick={() => router.push('/bounties')}>Back to Bounties</Button>
        </div>
      </div>
    )
  }

  const daysLeft = currentBounty.endsAt
    ? Math.ceil((new Date(currentBounty.endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null
  const escrowSol = currentBounty.escrowBalanceLamports ? currentBounty.escrowBalanceLamports / 1_000_000_000 : 0
  const escrowExplorerUrl = currentBounty.escrowAddress
    ? `https://explorer.solana.com/address/${currentBounty.escrowAddress}?cluster=devnet`
    : null
  const txExplorerUrl = currentBounty.txSignature
    ? `https://explorer.solana.com/tx/${currentBounty.txSignature}?cluster=devnet`
    : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container-custom py-6">
          <Button variant="ghost" onClick={() => router.push('/bounties')} className="mb-4 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bounties
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
                  {currentBounty.company.logoUrl ? (
                    <img
                      src={currentBounty.company.logoUrl || '/placeholder.svg'}
                      alt={currentBounty.company.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{currentBounty.company.name}</h3>
                    {currentBounty.company.isVerified && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <p className="text-sm text-muted-foreground">@{currentBounty.company.slug}</p>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-medium mb-4">{currentBounty.title}</h1>

              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
                  {currentBounty.bountyType}
                </Badge>
                <Badge variant="outline">{currentBounty.status}</Badge>
                {daysLeft !== null && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                  </div>
                )}
              </div>
            </div>

            <div className="process-card lg:min-w-[280px]">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">
                    {currentBounty.rewardAmount.toLocaleString()} SOL
                  </div>
                  <p className="text-sm text-muted-foreground">Reward per Submission</p>
                </div>
                <div className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-left">
                  <p className="text-xs uppercase text-muted-foreground">Escrow Balance</p>
                  <p className="text-lg font-semibold text-yellow-200">
                    {escrowSol.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL
                  </p>
                  {currentBounty.escrowAddress ? (
                    <p className="mt-2 text-[11px] font-mono break-all text-muted-foreground">
                      {currentBounty.escrowAddress}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {escrowExplorerUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={escrowExplorerUrl} target="_blank" rel="noopener noreferrer">
                          View Escrow Account
                        </Link>
                      </Button>
                    ) : null}
                    {txExplorerUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={txExplorerUrl} target="_blank" rel="noopener noreferrer">
                          Funding Transaction
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
              <Button className="w-full btn-primary" onClick={() => router.push(`/bounties/${bountyId}/submit`)}>
                Submit Bug Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Description */}
            <section className="process-card">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-semibold">Description</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">{currentBounty.description}</p>
              </div>
            </section>

            {/* Requirements */}
            {currentBounty.requirements && (
              <section className="process-card">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-semibold">Requirements</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {currentBounty.requirements}
                  </p>
                </div>
              </section>
            )}

            {/* Scope */}
            <section className="process-card">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-semibold">Scope</h2>
              </div>
              <div className="space-y-4">
                {currentBounty.inScope && (
                  <div>
                    <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      In Scope
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{currentBounty.inScope}</p>
                  </div>
                )}
                {currentBounty.outOfScope && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Out of Scope
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {currentBounty.outOfScope}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Guidelines */}
            {currentBounty.guidelines && (
              <section className="process-card">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-semibold">Guidelines</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {currentBounty.guidelines}
                  </p>
                </div>
              </section>
            )}

            {/* Submissions (for company members) */}
            {isCompanyMember && submissions.length > 0 && (
              <section className="process-card">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-semibold">Submissions</h2>
                </div>
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 rounded-lg bg-card border border-border hover:border-yellow-400/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{submission.title}</h3>
                        <Badge variant={submission.status === 'APPROVED' ? 'default' : 'secondary'}>
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        By {submission.reporter.displayName}
                        {submission.reporter.username ? ` (@${submission.reporter.username})` : ''} •{' '}
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Stats */}
            <div className="process-card">
              <h3 className="font-semibold mb-4">Bounty Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Total Submissions</span>
                  </div>
                  <span className="font-semibold">
                    {currentBounty.stats?.totalSubmissions || currentBounty._count?.submissions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Paid Submissions</span>
                  </div>
                  <span className="font-semibold text-green-400">{currentBounty.stats?.paidSubmissions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Pending Review</span>
                  </div>
                  <span className="font-semibold text-yellow-400">{currentBounty.stats?.pendingSubmissions || 0}</span>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="process-card">
              <h3 className="font-semibold mb-4">About Company</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
                  {currentBounty.company.logoUrl ? (
                    <img
                      src={currentBounty.company.logoUrl || '/placeholder.svg'}
                      alt={currentBounty.company.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{currentBounty.company.name}</h4>
                    {currentBounty.company.isVerified && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <p className="text-sm text-muted-foreground">@{currentBounty.company.slug}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href={`/companies/${currentBounty.company.slug}`}>View Company Profile</Link>
              </Button>
              {currentBounty.company.walletAddress ? (
                <p className="mt-4 text-[11px] font-mono break-all text-muted-foreground">
                  Wallet: {currentBounty.company.walletAddress}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
