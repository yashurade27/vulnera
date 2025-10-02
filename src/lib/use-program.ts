import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VulneraBounty } from '../../anchor/target/types/vulnera_bounty'
import IDL from '../../anchor/target/idl/vulnera_bounty.json'

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const provider = useMemo(() => {
    return new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    })
  }, [connection, wallet])

  const program = useMemo(() => {
    // The IDL object is the default export from the JSON file.
    const idl = IDL as VulneraBounty;
    // The Program constructor now infers the program ID from the IDL's "address" field.
    return new Program<VulneraBounty>(idl, provider)
  }, [provider])

  return { program, provider }
}
