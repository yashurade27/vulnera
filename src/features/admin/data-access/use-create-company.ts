'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCompanySchema, type CreateCompanyInput } from '@/lib/types'

async function postCompany(payload: CreateCompanyInput) {
  const parsed = createCompanySchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid company data");
  }

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    company: {
      id: "comp_" + Math.random().toString(36).substr(2, 9),
      ...parsed.data,
    },
  };
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
