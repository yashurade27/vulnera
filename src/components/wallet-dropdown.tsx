'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as React from 'react'
import { ellipsify, UiWallet, useWalletUi, useWalletUiWallet } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function WalletAvatar({ className, wallet }: { className?: string; wallet: UiWallet }) {
  return (
    <Avatar className={cn('rounded-md h-6 w-6', className)}>
      <AvatarImage src={wallet.icon} alt={wallet.name} />
      <AvatarFallback>{wallet.name[0]}</AvatarFallback>
    </Avatar>
  )
}

function WalletDropdownItem({ wallet }: { wallet: UiWallet }) {
  const { connect } = useWalletUiWallet({ wallet })

  const handleConnect = async () => {
    try {
      console.log('[WalletDropdown] Attempting to connect to:', wallet.name)
      await connect()
      console.log('[WalletDropdown] Successfully connected to:', wallet.name)
    } catch (error) {
      // Ignore user rejections and plugin closed errors
      const ignoredMessages = ['user rejected', 'plugin closed', 'cancelled']
      const isIgnored = ignoredMessages.some(msg => 
        error instanceof Error && error.message?.toLowerCase().includes(msg)
      )
      
      if (!isIgnored) {
        console.error('[WalletDropdown] Connection error:', {
          wallet: wallet.name,
          error: error instanceof Error ? error.message : String(error)
        })
      } else {
        console.log('[WalletDropdown] User cancelled connection to:', wallet.name)
      }
    }
  }

  return (
    <DropdownMenuItem
      className="cursor-pointer"
      key={wallet.name}
      onClick={handleConnect}
    >
      {wallet.icon ? <WalletAvatar wallet={wallet} /> : null}
      {wallet.name}
    </DropdownMenuItem>
  )
}

function WalletDropdown() {
  const { account, connected, copy, disconnect, wallet, wallets } = useWalletUi()
  
  // Safety check for wallets array
  const walletList = wallets || []
  
  React.useEffect(() => {
    console.log('[WalletDropdown] State:', {
      connected,
      hasAccount: !!account,
      walletName: wallet?.name || 'none',
      availableWallets: walletList.length
    })
  }, [connected, account, wallet, walletList.length])
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          {wallet?.icon ? <WalletAvatar wallet={wallet} /> : null}
          {connected ? (account ? ellipsify(account.address) : wallet?.name) : 'Select Wallet'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {account ? (
          <>
            <DropdownMenuItem 
              className="cursor-pointer" 
              onClick={() => {
                try {
                  console.log('[WalletDropdown] Copying address:', account.address)
                  copy()
                } catch (error) {
                  console.error('[WalletDropdown] Copy error:', error)
                }
              }}
            >
              Copy address
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer" 
              onClick={async () => {
                try {
                  console.log('[WalletDropdown] Disconnecting wallet')
                  await disconnect()
                  console.log('[WalletDropdown] Successfully disconnected')
                } catch (error) {
                  console.error('[WalletDropdown] Disconnect error:', error)
                }
              }}
            >
              Disconnect
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {walletList.length > 0 ? (
          walletList.map((wallet) => <WalletDropdownItem key={wallet.name} wallet={wallet} />)
        ) : (
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="https://solana.com/solana-wallets" target="_blank" rel="noopener noreferrer">
              Get a Solana wallet to connect.
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { WalletDropdown }