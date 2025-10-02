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
  const { page = 1, limit = 20, status, type, reporterId, sortBy, sortOrder } = filters
  const params = new URLSearchParams()

  params.set('limit', limit.toString())
  params.set('offset', ((page - 1) * limit).toString())
  if (status) params.set('status', status)
  if (type) params.set('type', type)
  if (reporterId) params.set('reporterId', reporterId)
  if (sortBy) params.set('sortBy', sortBy)
  if (sortOrder) params.set('sortOrder', sortOrder)

  const response = await fetch(`/api/admin/reports?${params.toString()}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to load reports')
  }

  return response.json() as Promise<AdminReportsResponse>
}

export function useAdminReports(filters: AdminReportFilters) {
  return useQuery({
    queryKey: ['admin', 'reports', filters],
    queryFn: () => fetchAdminReports(filters),
    placeholderData: keepPreviousData,
  })
}
