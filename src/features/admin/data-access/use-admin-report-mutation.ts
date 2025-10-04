'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateReportSchema, type UpdateReportInput } from '@/lib/types'
import { AdminReportFilters } from './use-admin-reports'

export interface UpdateAdminReportInput extends UpdateReportInput {
  reportId: string
}

async function patchAdminReport({ reportId, ...payload }: UpdateAdminReportInput) {
  const parsed = updateReportSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid report data')
  }

  const response = await fetch(`/api/reports/${reportId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(parsed.data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error ?? 'Failed to update report')
  }

  return response.json() as Promise<unknown>
}

export function useUpdateAdminReport(filters: AdminReportFilters) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patchAdminReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports', filters] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
