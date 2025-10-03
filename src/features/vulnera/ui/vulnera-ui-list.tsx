import { VulneraUiCard } from './vulnera-ui-card'
import { useVulneraAccountsQuery } from '@/features/vulnera/data-access/use-vulnera-accounts-query'
import { UiWalletAccount } from '@wallet-ui/react'

export function VulneraUiList({ account }: { account: UiWalletAccount }) {
  const vulneraAccountsQuery = useVulneraAccountsQuery()

  if (vulneraAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!vulneraAccountsQuery.data || vulneraAccountsQuery.data.length === 0) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {vulneraAccountsQuery.data.map((vulnera) => (
        <VulneraUiCard account={account} key={vulnera.address} vulnera={vulnera} />
      ))}
    </div>
  )
}
