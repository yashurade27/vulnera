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
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    report: {
      id: reportId,
      title: "Unfair Rejection of Submission",
      description: "My submission was unfairly rejected without proper explanation.",
      type: "UNFAIR_REJECTION",
      status: "OPEN",
      evidence: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      resolution: null,
      actionTaken: null,
      reporter: {
        id: "user_123",
        username: "bounty_hunter_1",
        email: "hunter@example.com",
        fullName: "John Doe",
        role: "BOUNTY_HUNTER",
      },
      submission: {
        id: "sub_789",
        title: "XSS Vulnerability in Dashboard",
        description: "A cross-site scripting vulnerability exists in the main dashboard.",
        status: "REJECTED",
        submittedAt: new Date().toISOString(),
        bounty: {
          id: "bounty_456",
          title: "Harden Dashboard Security",
          company: {
            id: "comp_789",
            name: "TechCorp",
            slug: "techcorp",
          },
        },
      },
      reportedUser: null,
      reportedCompany: {
        id: "comp_789",
        name: "TechCorp",
        slug: "techcorp",
        isVerified: true,
        isActive: true,
      },
    },
  };
}

export function useAdminReportDetail(reportId?: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'detail', reportId],
    queryFn: () => fetchAdminReportDetail(reportId ?? ''),
    enabled: Boolean(reportId),
  })
}
