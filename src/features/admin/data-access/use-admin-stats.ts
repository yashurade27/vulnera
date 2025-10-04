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
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    overview: {
      totalUsers: 100,
      totalCompanies: 20,
      totalBounties: 50,
      activeBounties: 15,
      totalSubmissions: 200,
      resolvedVulnerabilities: 150,
      totalPayments: 100,
      totalBountyRewards: 50000,
    },
    userBreakdown: {
      bountyHunters: 80,
      companyAdmins: 15,
      admins: 5,
    },
    companyBreakdown: {
      verified: 10,
      unverified: 10,
    },
    bountyBreakdown: {
      active: 15,
      closed: 30,
      expired: 5,
    },
    submissionBreakdown: {
      pending: 20,
      approved: 150,
      rejected: 20,
      duplicate: 5,
      spam: 5,
      needsMoreInfo: 0,
    },
    paymentBreakdown: {
      pending: 5,
      processing: 2,
      completed: 90,
      failed: 3,
      refunded: 0,
    },
  };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 60_000,
  })
}
