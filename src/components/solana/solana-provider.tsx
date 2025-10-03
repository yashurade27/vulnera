'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ReactNode, useMemo, useCallback, useEffect } from 'react'
import { useCluster } from '@/features/cluster/cluster-context'

import '@solana/wallet-adapter-react-ui/styles.css'

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  
  const wallets = useMemo(() => {
    console.log('[SolanaProvider] Initializing wallet adapters')
    try {
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new TorusWalletAdapter()
      ]
    } catch (error) {
      console.error('[SolanaProvider] Error initializing wallet adapters:', error)
      return []
    }
  }, [])

  const onError = useCallback((error: Error) => {
    // Ignore user rejections and Vercel Live origin warnings
    const ignoredMessages = [
      'User rejected the request',
      'user rejected',
      'Plugin Closed',
      'origins don\'t match',
      'vercel.live'
    ]
    
    const shouldIgnore = ignoredMessages.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase())
    )
    
    if (!shouldIgnore) {
      console.error('[Wallet Error]', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    } else {
      console.log('[Wallet Info] User action or non-critical warning:', error.message)
    }
  }, [])

  useEffect(() => {
    console.log('[SolanaProvider] Connected to endpoint:', endpoint)
  }, [endpoint])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
