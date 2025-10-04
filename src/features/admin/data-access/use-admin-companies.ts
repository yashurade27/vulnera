'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

export interface AdminCompanyFilters {
  search?: string
  verified?: 'true' | 'false'
  active?: 'true' | 'false'
  page?: number
  limit?: number
}

export interface AdminCompanySummary {
  id: string
  name: string
  slug: string
  description: string | null
  website: string | null
  logoUrl: string | null
  industry: string | null
  companySize: string | null
  location: string | null
  isVerified: boolean
  isActive: boolean
  totalBountiesFunded: string | number
  totalBountiesPaid: string | number
  activeBounties: number
  resolvedVulnerabilities: number
  reputation: number
  createdAt: string
  updatedAt: string
  _count: {
    bounties: number
    members: number
  }
}

export interface AdminCompaniesResponse {
  companies: AdminCompanySummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function fetchAdminCompanies(filters: AdminCompanyFilters = {}): Promise<AdminCompaniesResponse> {
  const { page = 1, limit = 20, search, verified, active } = filters
  const params = new URLSearchParams()

  params.set('limit', limit.toString())
  params.set('offset', ((page - 1) * limit).toString())
  if (search) params.set('search', search)
  if (verified) params.set('verified', verified)
  if (active) params.set('active', active)

  const response = await fetch(`/api/companies?${params.toString()}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to load companies')
  }

  return response.json() as Promise<AdminCompaniesResponse>
}

export function useAdminCompanies(filters: AdminCompanyFilters) {
  return useQuery({
    queryKey: ['admin', 'companies', filters],
    queryFn: () => fetchAdminCompanies(filters),
    placeholderData: keepPreviousData,
  })
}
