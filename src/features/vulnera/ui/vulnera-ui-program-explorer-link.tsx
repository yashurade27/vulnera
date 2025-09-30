import { VULNERA_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function VulneraUiProgramExplorerLink() {
  return <AppExplorerLink address={VULNERA_PROGRAM_ADDRESS} label={ellipsify(VULNERA_PROGRAM_ADDRESS)} />
}
