'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ReactNode, useMemo, useCallback, useEffect, useState } from 'react'
import { useCluster } from '@/features/cluster/cluster-context'

import '@solana/wallet-adapter-react-ui/styles.css'

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const [providerError, setProviderError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const wallets = useMemo(() => {
    console.log('[SolanaProvider] Initializing wallet adapters (attempt:', retryCount + 1, ')')
    try {
      setProviderError(null)
      const adapters = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new TorusWalletAdapter()
      ]
      console.log('[SolanaProvider] Successfully initialized', adapters.length, 'wallet adapters')
      return adapters
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error initializing wallets'
      console.error('[SolanaProvider] Error initializing wallet adapters:', error)
      setProviderError(errorMessage)
      return []
    }
  }, [retryCount])

  const onError = useCallback((error: Error) => {
    // Ignore user rejections and Vercel Live origin warnings
    const ignoredMessages = [
      'User rejected the request',
      'user rejected',
      'Plugin Closed',
      'origins don\'t match',
      'vercel.live',
      'User declined authorization',
      'Wallet not connected'
    ]
    
    const shouldIgnore = ignoredMessages.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase())
    )
    
    if (!shouldIgnore) {
      console.error('[Wallet Error]', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        endpoint,
        retryCount
      })
      
      // Set provider error for critical issues
      if (error.message?.includes('Network') || error.message?.includes('Connection')) {
        setProviderError(error.message)
        
        // Auto-retry for network issues (max 3 attempts)
        if (retryCount < 3) {
          console.log('[SolanaProvider] Attempting to recover from error...')
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 2000)
        }
      }
    } else {
      console.log('[Wallet Info] User action or non-critical warning:', error.message)
    }
  }, [endpoint, retryCount])

  useEffect(() => {
    console.log('[SolanaProvider] Connected to endpoint:', endpoint)
  }, [endpoint])

  // Show error UI if provider failed to initialize
  if (providerError && retryCount >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Wallet Connection Error</h2>
          <p className="text-muted-foreground max-w-md">
            Unable to initialize wallet connection: {providerError}
          </p>
          <button 
            onClick={() => {
              setRetryCount(0)
              setProviderError(null)
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  try {
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    )
  } catch (error) {
    console.error('[SolanaProvider] Provider render error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Wallet Provider Error</h2>
          <p className="text-muted-foreground">Failed to render wallet provider</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
