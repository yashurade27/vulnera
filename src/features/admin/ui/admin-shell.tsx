'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Building2, Users, FileWarning } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Companies', href: '/admin/companies', icon: Building2 },
  { label: 'Reports', href: '/admin/reports', icon: FileWarning },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex min-h-[70vh] w-full rounded-xl border border-border/40 bg-background/70 shadow-sm">
        <Sidebar collapsible="icon" variant="inset" className="border-r border-border/60 bg-card/40">
          <SidebarHeader className="px-4 py-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Control Center</p>
              <h2 className="text-lg font-semibold">Admin</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Support</SidebarGroupLabel>
              <SidebarGroupContent>
                <p className="text-xs text-muted-foreground px-2 leading-5">
                  Manage users, companies, and reports while monitoring platform health.
                </p>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="bg-background/50">
          <div className="flex h-full flex-col gap-6 p-4 sm:p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
