import { VulneraAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useVulneraSetMutation } from '@/features/vulnera/data-access/use-vulnera-set-mutation'

export function VulneraUiButtonSet({ account, vulnera }: { account: UiWalletAccount; vulnera: VulneraAccount }) {
  const setMutation = useVulneraSetMutation({ account, vulnera })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', vulnera.data.count.toString() ?? '0')
        if (!value || parseInt(value) === vulnera.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}
