import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'

const PROGRAM_ID = new PublicKey('5E6gim2SHCpuaJ4Lg3nq2nxs1So1t9MDU5ACdPdB1U6W')

// Discriminator for process_payment instruction from IDL
const PROCESS_PAYMENT_DISCRIMINATOR = Buffer.from([189, 81, 30, 198, 139, 186, 115, 23])

/**
 * Derives the vault PDA address
 */
export function deriveVaultAddress(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bounty-escrow'), owner.toBuffer()],
    PROGRAM_ID
  )
}

/**
 * Builds the process_payment instruction
 */
export function buildProcessPaymentInstruction(params: {
  owner: PublicKey
  hunterWallet: PublicKey
  platformWallet: PublicKey
  bountyId: string
  submissionId: string
  customAmount: number | null
  rewardPerSubmission: number
  maxSubmissions: number
  currentPaidSubmissions: number
}): TransactionInstruction {
  // Derive the vault PDA
  const [vaultPDA] = deriveVaultAddress(params.owner)

  // Manually serialize the instruction data to match Anchor's format
  const bountyIdBytes = Buffer.from(params.bountyId, 'utf-8')
  const submissionIdBytes = Buffer.from(params.submissionId, 'utf-8')
  
  // Calculate total size
  let dataSize = 
    4 + bountyIdBytes.length +  // bounty_id (length prefix + string)
    4 + submissionIdBytes.length +  // submission_id (length prefix + string)
    1 +  // custom_amount option flag
    (params.customAmount !== null ? 8 : 0) +  // custom_amount value if present
    8 +  // reward_per_submission (u64)
    4 +  // max_submissions (u32)
    4    // current_paid_submissions (u32)

  const buffer = Buffer.alloc(dataSize)
  let offset = 0

  // Write bounty_id (string = u32 length + bytes)
  buffer.writeUInt32LE(bountyIdBytes.length, offset)
  offset += 4
  bountyIdBytes.copy(buffer, offset)
  offset += bountyIdBytes.length

  // Write submission_id (string = u32 length + bytes)
  buffer.writeUInt32LE(submissionIdBytes.length, offset)
  offset += 4
  submissionIdBytes.copy(buffer, offset)
  offset += submissionIdBytes.length

  // Write custom_amount (Option<u64>)
  if (params.customAmount !== null) {
    buffer.writeUInt8(1, offset) // Some
    offset += 1
    const amountBigInt = BigInt(params.customAmount)
    // Write u64 as little-endian bytes
    for (let i = 0; i < 8; i++) {
      buffer.writeUInt8(Number((amountBigInt >> BigInt(i * 8)) & BigInt(0xff)), offset + i)
    }
    offset += 8
  } else {
    buffer.writeUInt8(0, offset) // None
    offset += 1
  }

  // Write reward_per_submission (u64)
  const rewardBigInt = BigInt(params.rewardPerSubmission)
  for (let i = 0; i < 8; i++) {
    buffer.writeUInt8(Number((rewardBigInt >> BigInt(i * 8)) & BigInt(0xff)), offset + i)
  }
  offset += 8

  // Write max_submissions (u32)
  buffer.writeUInt32LE(params.maxSubmissions, offset)
  offset += 4

  // Write current_paid_submissions (u32)
  buffer.writeUInt32LE(params.currentPaidSubmissions, offset)

  // Combine discriminator and serialized data
  const data = Buffer.concat([PROCESS_PAYMENT_DISCRIMINATOR, buffer])

  // Build the instruction
  return new TransactionInstruction({
    keys: [
      { pubkey: vaultPDA, isSigner: false, isWritable: true },
      { pubkey: params.owner, isSigner: true, isWritable: true },
      { pubkey: params.hunterWallet, isSigner: false, isWritable: true },
      { pubkey: params.platformWallet, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  })
}
