'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Download, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WalletConnectionGuideProps {
  className?: string
  companyWallet?: string
}

export function WalletConnectionGuide({ className, companyWallet }: WalletConnectionGuideProps) {
  const { connected, connecting, publicKey, select, wallet, wallets } = useWallet()
  const [detectedWallets, setDetectedWallets] = useState<Record<string, boolean>>({})
  
  useEffect(() => {
    // Check for installed wallets
    const checkWallets = () => {
      const detected = {
        phantom: !!(window as any)?.phantom?.solana,
        solflare: !!(window as any)?.solflare,
        backpack: !!(window as any)?.backpack,
        coinbase: !!(window as any)?.coinbaseSolana,
      }
      setDetectedWallets(detected)
    }
    
    checkWallets()
    
    // Re-check after a short delay in case wallets load asynchronously
    const timeout = setTimeout(checkWallets, 2000)
    return () => clearTimeout(timeout)
  }, [])
  
  const hasInstalledWallets = Object.values(detectedWallets).some(Boolean)
  const walletMatches = publicKey?.toBase58() === companyWallet
  
  const walletOptions = [
    {
      name: 'Phantom',
      detected: detectedWallets.phantom,
      installUrl: 'https://phantom.app/',
      description: 'Most popular Solana wallet'
    },
    {
      name: 'Solflare',
      detected: detectedWallets.solflare,
      installUrl: 'https://solflare.com/',
      description: 'Full-featured Solana wallet'
    },
    {
      name: 'Backpack',
      detected: detectedWallets.backpack,
      installUrl: 'https://backpack.app/',
      description: 'Modern crypto wallet'
    }
  ]
  
  if (connected && walletMatches) {
    return (
      <Card className={cn('border-green-500/20 bg-green-500/5', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <CardTitle className="text-green-400">Wallet Connected</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-green-300">
            Your wallet is connected and matches the company wallet address.
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {publicKey?.toBase58()}
          </p>
        </CardContent>
      </Card>
    )
  }
  
  if (connected && !walletMatches) {
    return (
      <Card className={cn('border-yellow-500/20 bg-yellow-500/5', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <CardTitle className="text-yellow-400">Wrong Wallet</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-yellow-300">
            Connected wallet doesn't match your company wallet. Please connect the correct wallet.
          </p>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">Connected:</span>
              <span className="font-mono ml-2">{publicKey?.toBase58()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Expected:</span>
              <span className="font-mono ml-2">{companyWallet}</span>
            </div>
          </div>
          <WalletMultiButton className="w-full" />
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={cn('border-blue-500/20 bg-blue-500/5', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-blue-400">Connect Your Wallet</CardTitle>
        <CardDescription>
          {hasInstalledWallets 
            ? 'Select a wallet to connect to your account'
            : 'Install a Solana wallet to get started'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {hasInstalledWallets ? (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Available Wallets:</h4>
              <div className="grid gap-2">
                {walletOptions
                  .filter(w => w.detected)
                  .map(walletOpt => (
                    <div key={walletOpt.name} className="flex items-center justify-between p-2 rounded border border-border/50">
                      <div>
                        <div className="font-medium text-sm">{walletOpt.name}</div>
                        <div className="text-xs text-muted-foreground">{walletOpt.description}</div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                  ))
                }
              </div>
            </div>
            <WalletMultiButton 
              className="w-full"
              style={{
                backgroundColor: 'rgb(var(--primary))',
                color: 'rgb(var(--primary-foreground))'
              }}
            />
          </>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No Solana wallets detected. Install one of these popular options:
              </p>
              <div className="grid gap-3">
                {walletOptions.map(walletOpt => (
                  <div key={walletOpt.name} className="flex items-center justify-between p-3 rounded border border-border/50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{walletOpt.name}</div>
                      <div className="text-xs text-muted-foreground">{walletOpt.description}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="shrink-0"
                    >
                      <a href={walletOpt.installUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" />
                        Install
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                After installing, refresh this page to connect
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="w-full mt-2"
              >
                Refresh Page
              </Button>
            </div>
          </>
        )}
        
        {connecting && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Connecting...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}