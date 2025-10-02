'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAdminUsers, type AdminUserFilters, type AdminUserSummary } from '../data-access/use-admin-users'
import { useUpdateAdminUser } from '../data-access/use-admin-user-mutation'
import { AdminPageHeader } from './admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2, RefreshCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Skeleton } from '@/components/ui/skeleton'

const formSchema = z.object({
  role: z.enum(['BOUNTY_HUNTER', 'COMPANY_ADMIN', 'ADMIN']),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
  emailVerified: z.boolean(),
  reputation: z.number().min(0).max(10000),
})

type EditUserFormValues = z.infer<typeof formSchema>

const integerFormatter = new Intl.NumberFormat('en-US')
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 9,
})

const ROLES = [
  { label: 'All roles', value: undefined },
  { label: 'Bounty Hunter', value: 'BOUNTY_HUNTER' },
  { label: 'Company Admin', value: 'COMPANY_ADMIN' },
  { label: 'Admin', value: 'ADMIN' },
] as const

const STATUSES = [
  { label: 'All statuses', value: undefined },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Banned', value: 'BANNED' },
] as const

export function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUserFilters>({ page: 1, limit: 10 })
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useAdminUsers(filters)
  const updateUserMutation = useUpdateAdminUser(filters)

  const form = useForm<EditUserFormValues>({
    defaultValues: {
      role: 'BOUNTY_HUNTER',
      status: 'ACTIVE',
      emailVerified: false,
      reputation: 100,
    },
  })

  useEffect(() => {
    if (selectedUser && isDialogOpen) {
      form.reset({
        role: selectedUser.role,
        status: selectedUser.status,
        emailVerified: Boolean(selectedUser.emailVerified),
        reputation: Math.round(Number(selectedUser.reputation ?? 0)),
      })
    }
  }, [form, isDialogOpen, selectedUser])

  const pagination = data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1
  const currentPage = filters.page ?? 1

  const handleSubmitForm = (values: EditUserFormValues) => {
    const result = formSchema.safeParse(values)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        form.setError(issue.path[0] as keyof EditUserFormValues, {
          message: issue.message,
        })
      })
      return
    }

    if (!selectedUser) return

    updateUserMutation.mutate(
      {
        userId: selectedUser.id,
        ...result.data,
      },
      {
        onSuccess: () => {
          toast.success('User updated successfully')
          setIsDialogOpen(false)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const handleOpenDialog = (user: AdminUserSummary) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilters((prev) => ({ ...prev, page: 1, search: searchTerm || undefined }))
  }

  const handlePageChange = (direction: 'next' | 'prev') => {
    setFilters((prev) => {
      const currentPage = prev.page ?? 1
      const target = direction === 'next' ? currentPage + 1 : currentPage - 1
      if (target < 1) return prev
      if (pagination && target > totalPages) return prev
      return { ...prev, page: target }
    })
  }

  const tableRows = useMemo(() => data?.users ?? [], [data])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Review user activity, adjust reputation, and control platform access."
        actions={
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        }
      />

      <Card className="border border-border/40 bg-card/40">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by email, username, or name"
              className="w-full sm:max-w-xs"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={filters.role ?? ''}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    role: value ? (value as AdminUserFilters['role']) : undefined,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((option) => (
                    <SelectItem key={option.label} value={option.value ?? ''}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status ?? ''}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value ? (value as AdminUserFilters['status']) : undefined,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((option) => (
                    <SelectItem key={option.label} value={option.value ?? ''}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="sm:self-stretch">
              Search
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load users. Try refreshing the page.
            </div>
          ) : tableRows.length === 0 ? (
            <div className="rounded-md border border-border/40 bg-background/40 p-6 text-center text-sm text-muted-foreground">
              No users match the current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reputation</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Total Bounties</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.fullName ?? user.username ?? user.email}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.status === 'ACTIVE' ? 'border-emerald-400/40 text-emerald-400' : 'border-yellow-400/40 text-yellow-300'}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{integerFormatter.format(Math.round(Number(user.reputation ?? 0)))}</TableCell>
                      <TableCell>{currencyFormatter.format(Number(user.totalEarnings ?? 0))} SOL</TableCell>
                      <TableCell>{integerFormatter.format(user.totalBounties ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                          Manage
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
                Page {filters.page ?? 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange('prev')} disabled={currentPage <= 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust user</DialogTitle>
            <DialogDescription>
              Update role, status, email verification, or reputation. Changes apply immediately.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BOUNTY_HUNTER">Bounty Hunter</SelectItem>
                        <SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="BANNED">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailVerified"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div>
                      <FormLabel>Email verified</FormLabel>
                      <p className="text-xs text-muted-foreground">Toggle user verification status.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reputation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reputation score</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={10000} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
