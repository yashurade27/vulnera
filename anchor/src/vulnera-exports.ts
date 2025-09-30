// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Vulnera, VULNERA_DISCRIMINATOR, VULNERA_PROGRAM_ADDRESS, getVulneraDecoder } from './client/js'
import VulneraIDL from '../target/idl/vulnera.json'

export type VulneraAccount = Account<Vulnera, string>

// Re-export the generated IDL and type
export { VulneraIDL }

export * from './client/js'

export function getVulneraProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getVulneraDecoder(),
    filter: getBase58Decoder().decode(VULNERA_DISCRIMINATOR),
    programAddress: VULNERA_PROGRAM_ADDRESS,
  })
}
