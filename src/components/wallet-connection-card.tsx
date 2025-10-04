'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, AlertTriangle, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WalletConnectionCardProps {
  companyWallet?: string
  onWalletConnected?: () => void
  showMismatchWarning?: boolean
}

export function WalletConnectionCard({ 
  companyWallet, 
  onWalletConnected,
  showMismatchWarning = false 
}: WalletConnectionCardProps) {
  const { connected, publicKey, connect, disconnect, wallet } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const connectedAddress = publicKey?.toBase58()
  const walletMatches = companyWallet && connectedAddress === companyWallet
  const hasWalletMismatch = connected && companyWallet && !walletMatches

  useEffect(() => {
    if (connected && onWalletConnected) {
      onWalletConnected()
    }
  }, [connected, onWalletConnected])

  const handleConnect = async () => {
    if (!wallet) {
      setConnectionError('Please select a wallet first')
      return
    }

    setIsConnecting(true)
    setConnectionError(null)
    
    try {
      await connect()
      setConnectionError(null)
    } catch (error) {
      console.error('Wallet connection error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      setConnectionError(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setConnectionError(null)
    } catch (error) {
      console.error('Wallet disconnect error:', error)
    }
  }

  return (
    <Card className="border-orange-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-orange-400" />
          <CardTitle className="text-lg">Wallet Connection</CardTitle>
        </div>
        <CardDescription>
          {connected 
            ? 'Your wallet is connected and ready' 
            : 'Connect your Solana wallet to create and fund bounties'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-sm">{connected ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>
          
          {connected && connectedAddress && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Address:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-8)}
              </code>
            </div>
          )}
          
          {companyWallet && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Company Wallet:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {companyWallet.slice(0, 8)}...{companyWallet.slice(-8)}
              </code>
            </div>
          )}
        </div>

        {/* Wallet Mismatch Warning */}
        {(hasWalletMismatch || showMismatchWarning) && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium mb-1">Wallet Mismatch</p>
              <p>
                The connected wallet doesn't match your company's registered wallet address. 
                Please connect the correct wallet or update your company profile.
              </p>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {connectionError && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-200">
              <p className="font-medium mb-1">Connection Error</p>
              <p>{connectionError}</p>
            </div>
          </div>
        )}

        {/* Connection Actions */}
        <div className="flex flex-col gap-2">
          {!connected ? (
            <>
              <WalletMultiButton className="!bg-gradient-to-r !from-yellow-400 !to-yellow-500 !text-gray-900 hover:!from-yellow-300 hover:!to-yellow-400 !border-0" />
              {wallet && (
                <Button
                  variant="outline"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="gap-2"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Connect {wallet.adapter.name}
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="flex-1"
              >
                Disconnect
              </Button>
              {hasWalletMismatch && (
                <Button
                  variant="outline"
                  onClick={() => setConnectionError(null)}
                  className="px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tips */}
        {!connected && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Tip:</strong> Make sure you have a Solana wallet extension installed</p>
            <p>🔒 Popular wallets: Phantom, Solflare, or Torus</p>
            <p>⚡ Ensure you're on the correct network (Devnet/Mainnet)</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}