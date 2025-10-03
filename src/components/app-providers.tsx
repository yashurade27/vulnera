'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { SessionProvider } from 'next-auth/react'
import React from 'react'
import { ClusterProvider } from '@/features/cluster/cluster-context'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider basePath="/api/auth" refetchInterval={5 * 60}>
      <ReactQueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClusterProvider>
            <SolanaProvider>{children}</SolanaProvider>
          </ClusterProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </SessionProvider>
  )
}
