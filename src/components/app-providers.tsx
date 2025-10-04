'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'
import { SolanaProvider } from '@/components/solana/solana-provider'
import { SessionProvider } from 'next-auth/react'
import React, { useEffect } from 'react'
import { ClusterProvider } from '@/features/cluster/cluster-context'
import { ErrorBoundary } from '@/components/error-boundary'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    // Log environment info
    console.log('[AppProviders] Initializing with:', {
      env: process.env.NODE_ENV,
      hasNextAuthUrl: !!process.env.NEXT_PUBLIC_AUTH_URL,
      origin: typeof window !== 'undefined' ? window.location.origin : 'SSR'
    })

    // Suppress Vercel Live origin mismatch warnings in console
    if (typeof window !== 'undefined') {
      const originalError = console.error
      console.error = (...args: unknown[]) => {
        const message = String(args[0])
        // Filter out Vercel Live warnings
        if (message.includes('origins don\'t match') && message.includes('vercel.live')) {
          return // Silently ignore
        }
        originalError.apply(console, args)
      }
    }
  }, [])

  return (
    <ErrorBoundary>
      <SessionProvider 
        basePath="/api/auth" 
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <ReactQueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ClusterProvider>
              <ErrorBoundary>
                <SolanaProvider>{children}</SolanaProvider>
              </ErrorBoundary>
            </ClusterProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
