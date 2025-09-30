import { useSolana } from '@/components/solana/use-solana'

export function useVulneraAccountsQueryKey() {
  const { cluster } = useSolana()

  return ['vulnera', 'accounts', { cluster }]
}
