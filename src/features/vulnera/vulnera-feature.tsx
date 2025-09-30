import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { VulneraUiButtonInitialize } from './ui/vulnera-ui-button-initialize'
import { VulneraUiList } from './ui/vulnera-ui-list'
import { VulneraUiProgramExplorerLink } from './ui/vulnera-ui-program-explorer-link'
import { VulneraUiProgramGuard } from './ui/vulnera-ui-program-guard'

export default function VulneraFeature() {
  const { account } = useSolana()

  return (
    <VulneraUiProgramGuard>
      <AppHero
        title="Vulnera"
        subtitle={
          account
            ? "Initialize a new vulnera onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <VulneraUiProgramExplorerLink />
        </p>
        {account ? (
          <VulneraUiButtonInitialize account={account} />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletDropdown />
          </div>
        )}
      </AppHero>
      {account ? <VulneraUiList account={account} /> : null}
    </VulneraUiProgramGuard>
  )
}
