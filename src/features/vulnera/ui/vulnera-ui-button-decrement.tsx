import { VulneraAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useVulneraDecrementMutation } from '../data-access/use-vulnera-decrement-mutation'

export function VulneraUiButtonDecrement({ account, vulnera }: { account: UiWalletAccount; vulnera: VulneraAccount }) {
  const decrementMutation = useVulneraDecrementMutation({ account, vulnera })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}
