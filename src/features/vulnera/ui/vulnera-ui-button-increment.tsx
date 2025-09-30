import { VulneraAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { useVulneraIncrementMutation } from '../data-access/use-vulnera-increment-mutation'

export function VulneraUiButtonIncrement({ account, vulnera }: { account: UiWalletAccount; vulnera: VulneraAccount }) {
  const incrementMutation = useVulneraIncrementMutation({ account, vulnera })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}
