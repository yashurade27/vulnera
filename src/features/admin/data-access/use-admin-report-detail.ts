'use client'

import { useQuery } from '@tanstack/react-query'

export interface AdminReportDetailResponse {
  report: {
    id: string
    title: string
    description: string
    type: string
    status: string
    evidence: string[]
    createdAt: string
    updatedAt: string
    resolvedAt: string | null
    resolution: string | null
    actionTaken: string | null
    reporter: {
      id: string
      username: string | null
      email: string
      fullName: string | null
      role: string
    }
    submission: {
      id: string
      title: string
      description: string
      status: string
      submittedAt: string
      bounty: {
        id: string
        title: string
        company: {
          id: string
          name: string
          slug: string
        }
      }
    } | null
    reportedUser: {
      id: string
      username: string | null
      fullName: string | null
      email: string
      role: string
      status: string
    } | null
    reportedCompany: {
      id: string
      name: string
      slug: string
      isVerified: boolean
      isActive: boolean
    } | null
  }
}

async function fetchAdminReportDetail(reportId: string): Promise<AdminReportDetailResponse> {
  const response = await fetch(`/api/reports/${reportId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to load report details')
  }

  return response.json() as Promise<AdminReportDetailResponse>
}

export function useAdminReportDetail(reportId?: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'detail', reportId],
    queryFn: () => fetchAdminReportDetail(reportId ?? ''),
    enabled: Boolean(reportId),
  })
}
