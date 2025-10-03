"use client"

import { useQuery } from "@tanstack/react-query"
import type { SubmissionStatus } from "@prisma/client"

export type UserSubmissionsSortField = "submittedAt" | "status" | "rewardAmount"
export type UserSubmissionsSortOrder = "asc" | "desc"

export interface UserSubmissionsQueryParams {
  userId: string
  page?: number
  limit?: number
  status?: SubmissionStatus
  search?: string
  sortBy?: UserSubmissionsSortField
  sortOrder?: UserSubmissionsSortOrder
  bountyId?: string
  companyId?: string
}

export interface UserSubmissionSummary {
  id: string
  title: string
  description: string | null
  bountyType: string
  status: SubmissionStatus
  submittedAt: string
  reviewedAt: string | null
  reviewNotes: string | null
  rewardAmount: number | null
  responseDeadline: string
  bountyId: string
  companyId: string
  _count: {
    comments: number
  }
  bounty: {
    id: string
    title: string
    status: string
    bountyTypes: string[]
    rewardAmount: number | null
  } | null
  company: {
    id: string
    name: string
  } | null
}

export interface UserSubmissionTopBounty {
  bountyId: string
  submissions: number
  title: string
  rewardAmount: number | null
  bountyTypes?: string[]
  company: {
    id: string
    name: string
  } | null
}

export interface UserSubmissionsResponse {
  user: {
    id: string
    username: string | null
    fullName: string | null
    avatarUrl: string | null
    reputation: number | null
    totalBounties: number
    totalEarnings: number
    createdAt: string
  }
  submissions: UserSubmissionSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  stats: {
    total: number
    totalReward: number
    latestSubmissionAt: string | null
    statusBreakdown: Record<SubmissionStatus, number>
    topBounties: UserSubmissionTopBounty[]
  }
}

const DEFAULT_LIMIT = 10

export function useUserSubmissionsQuery({
  userId,
  page = 1,
  limit = DEFAULT_LIMIT,
  status,
  search,
  sortBy = "submittedAt",
  sortOrder = "desc",
  bountyId,
  companyId,
}: UserSubmissionsQueryParams) {
  const offset = (page - 1) * limit

  const queryKey = [
    "user-submissions",
    userId,
    { page, limit, status, search, sortBy, sortOrder, bountyId, companyId },
  ] as const

  return useQuery<UserSubmissionsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("limit", limit.toString())
      params.set("offset", offset.toString())
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)

      if (status) params.set("status", status)
      if (search) params.set("search", search)
      if (bountyId) params.set("bountyId", bountyId)
      if (companyId) params.set("companyId", companyId)

      const response = await fetch(`/api/users/${userId}/submissions?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to load submissions (${response.status})`)
      }

      return (await response.json()) as UserSubmissionsResponse
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  })
}
