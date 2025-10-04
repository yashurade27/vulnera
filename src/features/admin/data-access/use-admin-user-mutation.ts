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
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error ?? 'Failed to update user')
  }

  return response.json() as Promise<unknown>
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
