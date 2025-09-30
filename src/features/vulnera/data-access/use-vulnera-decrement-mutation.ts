import { VulneraAccount, getDecrementInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useVulneraAccountsInvalidate } from './use-vulnera-accounts-invalidate'

export function useVulneraDecrementMutation({
  account,
  vulnera,
}: {
  account: UiWalletAccount
  vulnera: VulneraAccount
}) {
  const invalidateAccounts = useVulneraAccountsInvalidate()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ vulnera: vulnera.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
