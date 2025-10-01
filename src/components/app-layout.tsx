'use client'

import React from 'react'
import { ClusterUiChecker } from '@/features/cluster/ui/cluster-ui-checker'
import { AccountUiChecker } from '@/features/account/ui/account-ui-checker'
import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'

export function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto p-4">
          <ClusterUiChecker>
            <AccountUiChecker />
          </ClusterUiChecker>
          {children}
        </main>
        <AppFooter />
      </div>
      <Toaster closeButton />
    </ThemeProvider>
  )
}
