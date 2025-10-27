import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useConnection, useWallet, type AnchorWallet } from '@solana/wallet-adapter-react'
import idl from '../../anchor/target/idl/vulnera_bounty.json'

export const PROGRAM_ID = new PublicKey('8K6AdQyPxjCfVoTZtAZW7TnQjhsJFjEdR5tzVWzESVvB')

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
    const prog = new Program(idl as Idl, provider)
    
    // Debug: Log to verify program ID
    console.log('Program ID from PROGRAM_ID constant:', PROGRAM_ID.toBase58())
    console.log('Program ID from program instance:', prog.programId.toBase58())
    console.log('IDL address field:', (idl as any).address)
    
    return prog
  }, [provider])

  return { program, provider }
}
