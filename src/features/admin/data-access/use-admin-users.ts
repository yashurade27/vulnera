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
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const sampleUsers: AdminUserSummary[] = [
    {
      id: "1",
      email: "hunter@example.com",
      username: "bounty_hunter_1",
      fullName: "John Doe",
      role: "BOUNTY_HUNTER",
      status: "ACTIVE",
      emailVerified: true,
      walletAddress: "So11111111111111111111111111111111111111112",
      avatarUrl: null,
      country: "USA",
      totalEarnings: 1500,
      totalBounties: 5,
      reputation: 100,
      rank: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: "2",
      email: "admin@company.com",
      username: "company_admin_1",
      fullName: "Jane Smith",
      role: "COMPANY_ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      walletAddress: "So22222222222222222222222222222222222222222",
      avatarUrl: null,
      country: "Canada",
      totalEarnings: 0,
      totalBounties: 10,
      reputation: 0,
      rank: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
  ];

  return {
    users: sampleUsers,
    pagination: {
      total: 2,
      limit: 20,
      offset: 0,
      hasMore: false,
    },
  };
}

export function useAdminUsers(filters: AdminUserFilters) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => fetchAdminUsers(filters),
    placeholderData: keepPreviousData,
  })
}
