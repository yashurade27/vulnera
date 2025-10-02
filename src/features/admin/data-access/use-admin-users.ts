'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

export interface AdminUserFilters {
  search?: string
  role?: 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN'
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  page?: number
  limit?: number
}

export interface AdminUserSummary {
  id: string
  email: string
  username: string | null
  fullName: string | null
  role: 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  emailVerified: boolean
  walletAddress: string | null
  avatarUrl: string | null
  country: string | null
  totalEarnings: string | number
  totalBounties: number
  reputation: number
  rank: number | null
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export interface AdminUsersResponse {
  users: AdminUserSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function fetchAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUsersResponse> {
  const { page = 1, limit = 20, search, role, status } = filters
  const params = new URLSearchParams()

  params.set('limit', limit.toString())
  params.set('offset', ((page - 1) * limit).toString())

  if (search) params.set('search', search)
  if (role) params.set('role', role)
  if (status) params.set('status', status)

  const response = await fetch(`/api/admin/users?${params.toString()}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  const data = (await response.json()) as AdminUsersResponse
  return data
}

export function useAdminUsers(filters: AdminUserFilters) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => fetchAdminUsers(filters),
    placeholderData: keepPreviousData,
  })
}
