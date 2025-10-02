'use client'

import { useQuery } from '@tanstack/react-query'

export interface AdminStatsResponse {
  overview: {
    totalUsers: number
    totalCompanies: number
    totalBounties: number
    activeBounties: number
    totalSubmissions: number
    resolvedVulnerabilities: number
    totalPayments: number
    totalBountyRewards: number
  }
  userBreakdown: {
    bountyHunters: number
    companyAdmins: number
    admins: number
  }
  companyBreakdown: {
    verified: number
    unverified: number
  }
  bountyBreakdown: {
    active: number
    closed: number
    expired: number
  }
  submissionBreakdown: {
    pending: number
    approved: number
    rejected: number
    duplicate: number
    spam: number
    needsMoreInfo: number
  }
  paymentBreakdown: {
    pending: number
    processing: number
    completed: number
    failed: number
    refunded: number
  }
}

async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const response = await fetch('/api/admin/stats', {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to load admin stats')
  }

  const data = (await response.json()) as { stats: AdminStatsResponse }
  return data.stats
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 60_000,
  })
}
