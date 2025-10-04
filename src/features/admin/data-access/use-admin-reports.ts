'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

export interface AdminReportFilters {
  status?: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED'
  type?: 'LATE_RESPONSE' | 'UNFAIR_REJECTION' | 'SPAM_SUBMISSION' | 'INAPPROPRIATE_CONTENT' | 'OTHER'
  reporterId?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface AdminReportSummary {
  id: string
  title: string
  description: string
  type: string
  status: string
  evidence: string[]
  reporter: {
    id: string
    username: string | null
    email: string
  }
  reportedUser: {
    id: string
    username: string | null
    email: string
  } | null
  reportedCompany: {
    id: string
    name: string
    slug: string
  } | null
  submission: {
    id: string
    title: string
    status: string
  } | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  resolution: string | null
  actionTaken: string | null
}

export interface AdminReportsResponse {
  reports: AdminReportSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function fetchAdminReports(filters: AdminReportFilters = {}): Promise<AdminReportsResponse> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const sampleReports: AdminReportSummary[] = [
    {
      id: "1",
      title: "Unfair Rejection of Submission",
      description: "My submission was unfairly rejected without proper explanation.",
      type: "UNFAIR_REJECTION",
      status: "OPEN",
      evidence: [],
      reporter: {
        id: "user_123",
        username: "bounty_hunter_1",
        email: "hunter@example.com",
      },
      reportedUser: null,
      reportedCompany: {
        id: "comp_456",
        name: "TechCorp",
        slug: "techcorp",
      },
      submission: {
        id: "sub_789",
        title: "XSS Vulnerability in Dashboard",
        status: "REJECTED",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      resolution: null,
      actionTaken: null,
    },
  ];

  return {
    reports: sampleReports,
    pagination: {
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    },
  };
}

export function useAdminReports(filters: AdminReportFilters) {
  return useQuery({
    queryKey: ['admin', 'reports', filters],
    queryFn: () => fetchAdminReports(filters),
    placeholderData: keepPreviousData,
  })
}
