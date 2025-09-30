import { VulneraAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useVulneraCloseMutation } from '@/features/vulnera/data-access/use-vulnera-close-mutation'

export function VulneraUiButtonClose({ account, vulnera }: { account: UiWalletAccount; vulnera: VulneraAccount }) {
  const closeMutation = useVulneraCloseMutation({ account, vulnera })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
