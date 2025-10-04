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
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    company: {
      id: companyId,
      ...payload,
    },
  };
}

async function verifyCompany(companyId: string) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    company: {
      id: companyId,
      isVerified: true,
    },
  };
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
