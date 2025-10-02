'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from './admin-page-header'
import { useAdminReports, type AdminReportFilters } from '../data-access/use-admin-reports'
import { useAdminReportDetail } from '../data-access/use-admin-report-detail'
import { useUpdateAdminReport } from '../data-access/use-admin-report-mutation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, RefreshCcw } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateReportSchema } from '@/lib/types'

const REPORT_STATUSES = [
  { label: 'All statuses', value: undefined },
  { label: 'Open', value: 'OPEN' },
  { label: 'Under investigation', value: 'UNDER_INVESTIGATION' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Dismissed', value: 'DISMISSED' },
] as const

const REPORT_TYPES = [
  { label: 'All types', value: undefined },
  { label: 'Late response', value: 'LATE_RESPONSE' },
  { label: 'Unfair rejection', value: 'UNFAIR_REJECTION' },
  { label: 'Spam submission', value: 'SPAM_SUBMISSION' },
  { label: 'Inappropriate content', value: 'INAPPROPRIATE_CONTENT' },
  { label: 'Other', value: 'OTHER' },
] as const

const detailSchema = updateReportSchema.pick({ status: true, resolution: true, actionTaken: true })

type DetailFormValues = z.infer<typeof detailSchema>

const statusTone: Record<string, string> = {
  OPEN: 'border-amber-400/40 text-amber-300',
  UNDER_INVESTIGATION: 'border-sky-400/40 text-sky-300',
  RESOLVED: 'border-emerald-400/40 text-emerald-300',
  DISMISSED: 'border-muted-foreground/40 text-muted-foreground',
}

export function AdminReportsPage() {
  const [filters, setFilters] = useState<AdminReportFilters>({ page: 1, limit: 10 })
  const [reportId, setReportId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useAdminReports(filters)
  const { data: reportDetail, isLoading: isDetailLoading } = useAdminReportDetail(reportId ?? undefined)
  const updateReportMutation = useUpdateAdminReport(filters)

  const detailForm = useForm<DetailFormValues>({
    resolver: zodResolver(detailSchema),
    defaultValues: {
      status: 'OPEN',
      resolution: '',
      actionTaken: '',
    },
  })

  const pagination = data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1
  const currentPage = filters.page ?? 1

  const tableRows = useMemo(() => data?.reports ?? [], [data])

  useEffect(() => {
    if (!reportDetail?.report) return

    detailForm.reset({
      status: reportDetail.report.status as DetailFormValues['status'],
      resolution: reportDetail.report.resolution ?? '',
      actionTaken: reportDetail.report.actionTaken ?? '',
    })
  }, [reportDetail, detailForm])

  const handleSubmit = (values: DetailFormValues) => {
    if (!reportId) return

    updateReportMutation.mutate(
      { reportId, ...values },
      {
        onSuccess: () => {
          toast.success('Report updated successfully')
          setReportId(null)
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const handleOpen = (id: string) => {
    setReportId(id)
  }

  const handleClose = () => {
    setReportId(null)
    detailForm.reset()
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Report Moderation"
        description="Triage community reports, record outcomes, and maintain accountability."
        actions={
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        }
      />

      <Card className="border border-border/40 bg-card/40">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Select
              value={filters.status ?? ''}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value ? (value as AdminReportFilters['status']) : undefined,
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_STATUSES.map((option) => (
                  <SelectItem key={option.label} value={option.value ?? ''}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.type ?? ''}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  type: value ? (value as AdminReportFilters['type']) : undefined,
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((option) => (
                  <SelectItem key={option.label} value={option.value ?? ''}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Reporter ID"
              value={filters.reporterId ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  reporterId: event.target.value || undefined,
                  page: 1,
                }))
              }
            />

            <Select
              value={filters.sortOrder ?? 'desc'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  sortOrder: value as AdminReportFilters['sortOrder'],
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest first</SelectItem>
                <SelectItem value="asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load reports. Try refreshing.
            </div>
          ) : tableRows.length === 0 ? (
            <div className="rounded-md border border-border/40 bg-background/40 p-6 text-center text-sm text-muted-foreground">
              No reports match the current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{report.title ?? 'Report'}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{report.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusTone[report.status] ?? 'border-border/60'}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.type.replace('_', ' ')}</TableCell>
                      <TableCell>{report.reporter?.email ?? report.reporter?.username ?? 'Unknown'}</TableCell>
                      <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpen(report.id)}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination ? (
            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, currentPage - 1) }))} disabled={currentPage <= 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, currentPage + 1) }))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(reportId)} onOpenChange={(open) => (!open ? handleClose() : null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve report</DialogTitle>
            <DialogDescription>Review evidence, then update status and resolution notes.</DialogDescription>
          </DialogHeader>

          {isDetailLoading || !reportDetail ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/40 bg-background/40 p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={statusTone[reportDetail.report.status] ?? 'border-border/60'}>
                      {reportDetail.report.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{reportDetail.report.type.replace('_', ' ')}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold">{reportDetail.report.title ?? 'Report summary'}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{reportDetail.report.description}</p>
                </div>
              </div>

              {reportDetail.report.evidence?.length ? (
                <div className="rounded-lg border border-border/40 bg-background/40 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Evidence</h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    {reportDetail.report.evidence.map((item, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {reportDetail.report.reporter ? (
                  <DetailCard
                    title="Reporter"
                    items={[
                      { label: 'Name', value: reportDetail.report.reporter.fullName ?? reportDetail.report.reporter.username ?? '—' },
                      { label: 'Email', value: reportDetail.report.reporter.email },
                      { label: 'Role', value: reportDetail.report.reporter.role },
                    ]}
                  />
                ) : null}

                {reportDetail.report.reportedUser ? (
                  <DetailCard
                    title="Reported user"
                    items={[
                      { label: 'Name', value: reportDetail.report.reportedUser.fullName ?? reportDetail.report.reportedUser.username ?? '—' },
                      { label: 'Email', value: reportDetail.report.reportedUser.email },
                      { label: 'Status', value: reportDetail.report.reportedUser.status },
                    ]}
                  />
                ) : null}

                {reportDetail.report.reportedCompany ? (
                  <DetailCard
                    title="Reported company"
                    items={[
                      { label: 'Name', value: reportDetail.report.reportedCompany.name },
                      { label: 'Slug', value: reportDetail.report.reportedCompany.slug },
                      { label: 'Status', value: reportDetail.report.reportedCompany.isActive ? 'Active' : 'Inactive' },
                    ]}
                  />
                ) : null}

                {reportDetail.report.submission ? (
                  <DetailCard
                    title="Submission"
                    items={[
                      { label: 'Title', value: reportDetail.report.submission.title },
                      { label: 'Status', value: reportDetail.report.submission.status },
                      { label: 'Bounty', value: reportDetail.report.submission.bounty.title },
                    ]}
                  />
                ) : null}
              </div>

              <Form {...detailForm}>
                <form onSubmit={detailForm.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={detailForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REPORT_STATUSES.filter((option) => option.value).map((option) => (
                              <SelectItem key={option.value} value={option.value!}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={detailForm.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution</FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Resolution summary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={detailForm.control}
                    name="actionTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action taken</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Optional action notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={updateReportMutation.isPending}>
                      {updateReportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailCard({
  title,
  items,
}: {
  title: string
  items: { label: string; value: string | number | null }[]
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <dl className="mt-2 space-y-1 text-sm">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-right font-medium text-foreground">{item.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
