'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

export interface Cluster {
  name: WalletAdapterNetwork | 'localnet'
  endpoint: string
}

export const CLUSTERS: Cluster[] = [
  {
    name: WalletAdapterNetwork.Mainnet,
    endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL && process.env.NEXT_PUBLIC_CLUSTER === 'mainnet-beta' 
      ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL 
      : clusterApiUrl(WalletAdapterNetwork.Mainnet),
  },
  {
    name: WalletAdapterNetwork.Devnet,
    endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL && process.env.NEXT_PUBLIC_CLUSTER === 'devnet'
      ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
      : clusterApiUrl(WalletAdapterNetwork.Devnet),
  },
  {
    name: WalletAdapterNetwork.Testnet,
    endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL && process.env.NEXT_PUBLIC_CLUSTER === 'testnet'
      ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
      : clusterApiUrl(WalletAdapterNetwork.Testnet),
  },
  {
    name: 'localnet',
    endpoint: 'http://127.0.0.1:8899',
  },
]

export interface ClusterContextState {
  clusters: Cluster[]
  cluster: Cluster
  setCluster: (clusterName: WalletAdapterNetwork | 'localnet') => void
}

export const ClusterContext = createContext<ClusterContextState>({} as ClusterContextState)

export function ClusterProvider({ children }: { children: ReactNode }) {
  const getInitialCluster = (): WalletAdapterNetwork | 'localnet' => {
    const envCluster = process.env.NEXT_PUBLIC_CLUSTER
    if (envCluster === 'mainnet-beta' || envCluster === 'mainnet') {
      return WalletAdapterNetwork.Mainnet
    }
    if (envCluster === 'testnet') {
      return WalletAdapterNetwork.Testnet
    }
    if (envCluster === 'localnet') {
      return 'localnet'
    }
    // Default to devnet
    return WalletAdapterNetwork.Devnet
  }

  const [clusterName, setClusterName] = useState<WalletAdapterNetwork | 'localnet'>(getInitialCluster)

  const cluster = useMemo(() => CLUSTERS.find((c) => c.name === clusterName) ?? CLUSTERS[1], [clusterName])

  const value: ClusterContextState = {
    cluster,
    clusters: CLUSTERS,
    setCluster: setClusterName,
  }

  return <ClusterContext.Provider value={value}>{children}</ClusterContext.Provider>
}

export function useCluster() {
  return useContext(ClusterContext)
}
