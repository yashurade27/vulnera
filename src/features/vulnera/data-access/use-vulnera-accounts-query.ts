import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getVulneraProgramAccounts } from '@project/anchor'
import { useVulneraAccountsQueryKey } from './use-vulnera-accounts-query-key'

export function useVulneraAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useVulneraAccountsQueryKey(),
    queryFn: async () => await getVulneraProgramAccounts(client.rpc),
  })
}
