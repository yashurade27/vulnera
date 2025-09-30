import { Button } from '@/components/ui/button'
import { UiWalletAccount } from '@wallet-ui/react'

import { useVulneraInitializeMutation } from '@/features/vulnera/data-access/use-vulnera-initialize-mutation'

export function VulneraUiButtonInitialize({ account }: { account: UiWalletAccount }) {
  const mutationInitialize = useVulneraInitializeMutation({ account })

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Vulnera {mutationInitialize.isPending && '...'}
    </Button>
  )
}
