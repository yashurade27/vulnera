'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAdminCompanies,
  type AdminCompanyFilters,
  type AdminCompanySummary,
} from '../data-access/use-admin-companies'
import {
  useCreateCompany,
} from '../data-access/use-create-company'
import {
  useUpdateAdminCompany,
  useVerifyAdminCompany,
} from '../data-access/use-admin-company-mutation'
import { AdminPageHeader } from './admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Loader2, Plus, RefreshCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { type CreateCompanyInput } from '@/lib/types'

const manageCompanySchema = z.object({
  reputation: z.number().min(0).max(10000),
  isActive: z.boolean(),
  isVerified: z.boolean(),
})

type ManageCompanyFormValues = z.infer<typeof manageCompanySchema>

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim().length === 0 ? undefined : value

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().max(max).optional())

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional())

const createCompanyFormSchema = z.object({
  name: z.string().min(1).max(100),
  walletAddress: z.string().min(1),
  description: optionalText(1000),
  website: optionalUrl,
  industry: optionalText(50),
  companySize: optionalText(20),
  location: optionalText(100),
  logoUrl: optionalUrl,
})

type CreateCompanyFormValues = z.infer<typeof createCompanyFormSchema>

const VERIFIED_OPTIONS = [
  { label: 'All companies', value: 'all' },
  { label: 'Verified only', value: 'true' },
  { label: 'Unverified only', value: 'false' },
] as const

const ACTIVE_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
] as const

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 9,
})

const integerFormatter = new Intl.NumberFormat('en-US')

export function AdminCompaniesPage() {
  const [filters, setFilters] = useState<AdminCompanyFilters>({ page: 1, limit: 10 })
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanySummary | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useAdminCompanies(filters)
  const createCompanyMutation = useCreateCompany()
  const updateCompanyMutation = useUpdateAdminCompany(filters)
  const verifyCompanyMutation = useVerifyAdminCompany(filters)

  const manageForm = useForm<ManageCompanyFormValues>({
    defaultValues: {
      reputation: 100,
      isActive: true,
      isVerified: false,
    },
  })

  const createForm = useForm<CreateCompanyFormValues>({
    defaultValues: {
      name: '',
      walletAddress: '',
      description: '',
      website: '',
      industry: '',
      companySize: '',
      location: '',
      logoUrl: '',
    },
  })

  useEffect(() => {
    if (selectedCompany && isManageOpen) {
      manageForm.reset({
        reputation: Math.round(Number(selectedCompany.reputation ?? 0)),
        isActive: Boolean(selectedCompany.isActive),
        isVerified: Boolean(selectedCompany.isVerified),
      })
    }
  }, [isManageOpen, manageForm, selectedCompany])

  const pagination = data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1
  const currentPage = filters.page ?? 1

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilters((prev) => ({ ...prev, search: searchTerm || undefined, page: 1 }))
  }

  const handlePageChange = (direction: 'next' | 'prev') => {
    setFilters((prev) => {
      const current = prev.page ?? 1
      const target = direction === 'next' ? current + 1 : current - 1
      if (target < 1) return prev
      if (pagination && target > totalPages) return prev
      return { ...prev, page: target }
    })
  }

  const tableRows = useMemo(() => data?.companies ?? [], [data])

  const submitManageForm = (values: ManageCompanyFormValues) => {
    if (!selectedCompany) return

    const parsed = manageCompanySchema.safeParse(values)

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0]
        if (typeof path === 'string') {
          manageForm.setError(path as keyof ManageCompanyFormValues, { message: issue.message })
        }
      })
      toast.error('Check the highlighted fields and try again')
      return
    }

    updateCompanyMutation.mutate(
      { companyId: selectedCompany.id, ...parsed.data },
      {
        onSuccess: () => {
          toast.success('Company updated successfully')
          setIsManageOpen(false)
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const submitCreateForm = (values: CreateCompanyFormValues) => {
    const parsed = createCompanyFormSchema.safeParse(values)

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0]
        if (typeof path === 'string') {
          createForm.setError(path as keyof CreateCompanyFormValues, { message: issue.message })
        }
      })
      toast.error('Please correct the form and try again')
      return
    }

    const payload: CreateCompanyInput = {
      ...parsed.data,
    }

    createCompanyMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Company created successfully')
        setIsCreateOpen(false)
        createForm.reset()
      },
      onError: (error) => toast.error(error.message),
    })
  }

  const handleVerify = (company: AdminCompanySummary) => {
    verifyCompanyMutation.mutate(company.id, {
      onSuccess: () => toast.success(`${company.name} verified`),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Company Management"
        description="Verify organizations, onboard new partners, and adjust their reputation."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              <span className="sr-only">Refresh</span>
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New company
            </Button>
          </div>
        }
      />

      <Card className="border border-border/40 bg-card/40">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search companies"
              className="w-full sm:max-w-xs"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={filters.verified ?? 'all'}
                onValueChange={(value) => {
                  const nextValue = value === 'all' ? undefined : (value as AdminCompanyFilters['verified'])
                  setFilters((prev) => ({
                    ...prev,
                    verified: nextValue,
                    page: 1,
                  }))
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  {VERIFIED_OPTIONS.map((option) => (
                    <SelectItem key={option.label} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.active ?? 'all'}
                onValueChange={(value) => {
                  const nextValue = value === 'all' ? undefined : (value as AdminCompanyFilters['active'])
                  setFilters((prev) => ({
                    ...prev,
                    active: nextValue,
                    page: 1,
                  }))
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_OPTIONS.map((option) => (
                    <SelectItem key={option.label} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Search</Button>
          </form>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load companies. Try refreshing.
            </div>
          ) : tableRows.length === 0 ? (
            <div className="rounded-md border border-border/40 bg-background/40 p-6 text-center text-sm text-muted-foreground">
              No companies match the current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reputation</TableHead>
                    <TableHead>Active bounties</TableHead>
                    <TableHead>Total paid</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{company.name}</span>
                          <span className="text-xs text-muted-foreground">{company.website ?? company.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={company.isVerified ? 'border-emerald-400/40 text-emerald-300' : 'border-amber-400/40 text-amber-300'}
                          >
                            {company.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={company.isActive ? 'border-primary/40 text-primary' : 'border-rose-400/40 text-rose-300'}
                          >
                            {company.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{integerFormatter.format(Math.round(Number(company.reputation ?? 0)))}</TableCell>
                      <TableCell>{integerFormatter.format(company.activeBounties ?? 0)}</TableCell>
                      <TableCell>{currencyFormatter.format(Number(company.totalBountiesPaid ?? 0))} SOL</TableCell>
                      <TableCell>{integerFormatter.format(company._count?.members ?? 0)}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedCompany(company)
                          setIsManageOpen(true)
                        }}>
                          Manage
                        </Button>
                        {!company.isVerified ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVerify(company)}
                            disabled={verifyCompanyMutation.isPending}
                          >
                            Verify
                          </Button>
                        ) : null}
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

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust company</DialogTitle>
            <DialogDescription>Enable or disable access and adjust reputation to reflect trust.</DialogDescription>
          </DialogHeader>
          <Form {...manageForm}>
            <form onSubmit={manageForm.handleSubmit(submitManageForm)} className="space-y-4">
              <FormField
                control={manageForm.control}
                name="reputation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reputation score</FormLabel>
                    <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10000}
                          step={1}
                          value={field.value ?? 0}
                          onChange={(event) => {
                            const raw = event.target.value
                            const numeric = raw === '' ? 0 : Number(raw)
                            field.onChange(Number.isNaN(numeric) ? 0 : numeric)
                          }}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={manageForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <p className="text-xs text-muted-foreground">Inactive companies lose dashboard access.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={manageForm.control}
                name="isVerified"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div>
                      <FormLabel>Verified</FormLabel>
                      <p className="text-xs text-muted-foreground">Toggle the verified badge shown publicly.</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsManageOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCompanyMutation.isPending}>
                  {updateCompanyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open)
        if (!open) {
          createForm.reset()
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Onboard new company</DialogTitle>
            <DialogDescription>Collect the essentials to provision access and start verification.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(submitCreateForm)} className="grid gap-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Security" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet address</FormLabel>
                    <FormControl>
                      <Input placeholder="Wallet public key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Fintech" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company size</FormLabel>
                    <FormControl>
                      <Input placeholder="51-200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Singapore" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Short summary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCompanyMutation.isPending}>
                  {createCompanyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create company
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
