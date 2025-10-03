import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import { useConnection, useWallet, type AnchorWallet } from '@solana/wallet-adapter-react'
import idl from '../../anchor/Vulnera_idl.json'

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const provider = useMemo(() => {
  return new AnchorProvider(connection, wallet as AnchorWallet, {
      commitment: 'confirmed',
    })
  }, [connection, wallet])

  const program = useMemo(() => {
    const programId =
      (idl as { metadata?: { address?: string } }).metadata?.address ??
      (idl as { address?: string }).address ??
      'CZ6kuqEBvfdzM8h3rACEYazp771BFDXDMNgsoNSNvJ5Q'

    const parsedIdl = idl as unknown as Idl & { metadata?: { address?: string } }
    parsedIdl.metadata = { ...(parsedIdl.metadata ?? {}), address: programId }

    return new Program(parsedIdl, provider)
  }, [provider])

  return { program, provider }
}
