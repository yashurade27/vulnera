import { useQueryClient } from '@tanstack/react-query'
import { useVulneraAccountsQueryKey } from './use-vulnera-accounts-query-key'

export function useVulneraAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useVulneraAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}
