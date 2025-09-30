import { VulneraAccount } from '@project/anchor'
import { ellipsify, UiWalletAccount } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { VulneraUiButtonClose } from './vulnera-ui-button-close'
import { VulneraUiButtonDecrement } from './vulnera-ui-button-decrement'
import { VulneraUiButtonIncrement } from './vulnera-ui-button-increment'
import { VulneraUiButtonSet } from './vulnera-ui-button-set'

export function VulneraUiCard({ account, vulnera }: { account: UiWalletAccount; vulnera: VulneraAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vulnera: {vulnera.data.count}</CardTitle>
        <CardDescription>
          Account: <AppExplorerLink address={vulnera.address} label={ellipsify(vulnera.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <VulneraUiButtonIncrement account={account} vulnera={vulnera} />
          <VulneraUiButtonSet account={account} vulnera={vulnera} />
          <VulneraUiButtonDecrement account={account} vulnera={vulnera} />
          <VulneraUiButtonClose account={account} vulnera={vulnera} />
        </div>
      </CardContent>
    </Card>
  )
}
