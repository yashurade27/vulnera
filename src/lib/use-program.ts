import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useConnection, useWallet, type AnchorWallet } from '@solana/wallet-adapter-react'
import idl from '../../anchor/target/idl/vulnera_bounty.json'

export const PROGRAM_ID = new PublicKey('5E6gim2SHCpuaJ4Lg3nq2nxs1So1t9MDU5ACdPdB1U6W')

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const provider = useMemo(() => {
    if (!wallet || !wallet.publicKey || typeof wallet.signTransaction !== 'function' || typeof wallet.signAllTransactions !== 'function') {
      return null
    }

    return new AnchorProvider(connection, wallet as AnchorWallet, {
      commitment: 'confirmed',
    })
  }, [connection, wallet])

  const program = useMemo(() => {
    if (!provider) return null

    // Use the IDL directly - it already has the correct address
    return new Program(idl as Idl, provider)
  }, [provider])

  return { program, provider }
}
