'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateReportSchema, type UpdateReportInput } from '@/lib/types'
import { AdminReportFilters } from './use-admin-reports'

export interface UpdateAdminReportInput extends UpdateReportInput {
  reportId: string
}

async function patchAdminReport({ reportId, ...payload }: UpdateAdminReportInput) {
  const parsed = updateReportSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid report data");
  }

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    report: {
      id: reportId,
      ...parsed.data,
    },
  };
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
