'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminUserFilters } from './use-admin-users'

export interface UpdateAdminUserInput {
  userId: string
  role?: 'BOUNTY_HUNTER' | 'COMPANY_ADMIN' | 'ADMIN'
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  emailVerified?: boolean
  reputation?: number
}

async function patchAdminUser({ userId, ...payload }: UpdateAdminUserInput) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    user: {
      id: userId,
      ...payload,
    },
  };
}

export function useUpdateAdminUser(filters: AdminUserFilters) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patchAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', filters] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
