import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AppAlert } from '@/components/app-alert'
import { useSolana } from '@/components/solana/use-solana'
import { useClusterVersion } from '../data-access/use-cluster-version'
import { usePathname } from 'next/navigation'

const ALERT_ROUTE_PREFIXES = ['/dashboard', '/admin', '/account']

function shouldDisplayAlert(pathname: string | null) {
  if (!pathname) {
    return false
  }
  return ALERT_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function ClusterUiChecker({ children }: { children: ReactNode }) {
  const { cluster } = useSolana()
  const query = useClusterVersion()
  const pathname = usePathname()
  const displayAlert = shouldDisplayAlert(pathname)

  if (query.isLoading) {
    return null
  }

  if (query.isError || !query.data) {
    if (!displayAlert) {
      return <>{children}</>
    }

    return (
      <>
        <AppAlert
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Refresh
            </Button>
          }
          className="mb-4"
        >
          Error connecting to cluster <span className="font-bold">{cluster?.label}</span>.
        </AppAlert>
        {children}
      </>
    )
  }
  return children
}
