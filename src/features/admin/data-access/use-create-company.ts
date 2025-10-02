'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCompanySchema, type CreateCompanyInput } from '@/lib/types'

async function postCompany(payload: CreateCompanyInput) {
  const parsed = createCompanySchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid company data')
  }

  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(parsed.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error ?? 'Failed to create company')
  }

  return response.json() as Promise<unknown>
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCompanyInput) => postCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
