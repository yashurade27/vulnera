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
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  const sampleCompanies: AdminCompanySummary[] = [
    {
      id: "1",
      name: "TechCorp",
      slug: "techcorp",
      description: "A leading technology company.",
      website: "https://techcorp.com",
      logoUrl: "/techcorp.png",
      industry: "Technology",
      companySize: "100-500",
      location: "San Francisco, CA",
      isVerified: true,
      isActive: true,
      totalBountiesFunded: 100000,
      totalBountiesPaid: 50000,
      activeBounties: 10,
      resolvedVulnerabilities: 25,
      reputation: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        bounties: 15,
        members: 5,
      },
    },
    {
      id: "2",
      name: "Innovate LLC",
      slug: "innovate-llc",
      description: "An innovative startup.",
      website: "https://innovatellc.com",
      logoUrl: "/innovate.png",
      industry: "Technology",
      companySize: "10-50",
      location: "New York, NY",
      isVerified: false,
      isActive: true,
      totalBountiesFunded: 25000,
      totalBountiesPaid: 10000,
      activeBounties: 5,
      resolvedVulnerabilities: 10,
      reputation: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        bounties: 8,
        members: 3,
      },
    },
  ];

  return {
    companies: sampleCompanies,
    pagination: {
      total: 2,
      limit: 20,
      offset: 0,
      hasMore: false,
    },
  };
}

export function useAdminCompanies(filters: AdminCompanyFilters) {
  return useQuery({
    queryKey: ['admin', 'companies', filters],
    queryFn: () => fetchAdminCompanies(filters),
    placeholderData: keepPreviousData,
  })
}
