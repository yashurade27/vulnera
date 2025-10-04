'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminCompanyFilters } from './use-admin-companies'

export interface UpdateAdminCompanyInput {
  companyId: string
  reputation?: number
  isActive?: boolean
  isVerified?: boolean
}

async function patchAdminCompany({ companyId, ...payload }: UpdateAdminCompanyInput) {
  const response = await fetch(`/api/admin/companies/${companyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error ?? 'Failed to update company')
  }

  return response.json() as Promise<unknown>
}

async function verifyCompany(companyId: string) {
  const response = await fetch(`/api/admin/companies/${companyId}/verify`, {
    method: 'PATCH',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error ?? 'Failed to verify company')
  }

  return response.json() as Promise<unknown>
}

export function useUpdateAdminCompany(filters: AdminCompanyFilters) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patchAdminCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies', filters] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useVerifyAdminCompany(filters: AdminCompanyFilters) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies', filters] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
