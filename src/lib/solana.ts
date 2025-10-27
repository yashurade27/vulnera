import {
  Connection,
  PublicKey,
} from '@solana/web3.js'
import * as nacl from 'tweetnacl'

// Solana RPC endpoint - use environment variable or default to Helius Devnet
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Platform wallet address for fees - should be set in environment
// Program ID from the smart contract
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || '8K6AdQyPxjCfVoTZtAZW7TnQjhsJFjEdR5tzVWzESVvB',
)

// Minimum escrow amount (0.1 SOL = 100,000,000 lamports)
export const MIN_ESCROW_AMOUNT = 100_000_000

// Platform fee (2%)
export const PLATFORM_FEE_BPS = 200 // basis points

export class SolanaService {
  private connection: Connection

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed')
  }

  /**
   * Derive escrow PDA address for a given owner
   * Uses seeds: [b"bounty-escrow", owner.key()]
   */
  async deriveEscrowAddress(ownerPublicKey: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync([Buffer.from('bounty-escrow'), ownerPublicKey.toBuffer()], PROGRAM_ID)
  }

  /**
   * Verify wallet ownership by checking signature
   */
  async verifyWallet(walletAddress: string, signature: string, message: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(walletAddress)
      const signatureBytes = Buffer.from(signature, 'base64')
      const messageBytes = new TextEncoder().encode(message)

      // Use nacl for signature verification
      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes())
      return isValid
    } catch (error) {
      console.error('Wallet verification failed:', error)
      return false
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string) {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      })

      if (!tx) {
        return null
      }

      const accountKeys = tx.transaction.message.getAccountKeys()
      return {
        signature,
        slot: tx.slot,
        blockTime: tx.blockTime || undefined,
        status: tx.meta?.err ? 'failed' : 'confirmed',
        confirmations: 0, // confirmations is deprecated, always 0 for confirmed tx
        fee: tx.meta?.fee || 0,
        logs: tx.meta?.logMessages || [],
        accounts: Array.from(accountKeys.staticAccountKeys).map((key: PublicKey) => key.toString()),
        instructions: tx.transaction.message.compiledInstructions.length,
        recentBlockhash: tx.transaction.message.recentBlockhash,
      }
    } catch (error) {
      console.error('Failed to get transaction:', error)
      return null
    }
  }

  /**
   * Verify transaction exists and is confirmed
   */
  async verifyTransaction(signature: string): Promise<{ confirmed: boolean; blockTime?: number; status?: string }> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      })

      if (!tx) {
        return { confirmed: false }
      }

      return {
        confirmed: !tx.meta?.err,
        blockTime: tx.blockTime ?? undefined,
        status: tx.meta?.err ? 'failed' : 'confirmed',
      }
    } catch (error) {
      console.error('Transaction verification failed:', error)
      return { confirmed: false }
    }
  }

  /**
   * Get account balance
   */
  async getBalance(publicKey: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(publicKey))
      return balance
    } catch (error) {
      console.error('Failed to get balance:', error)
      return 0
    }
  }

  /**
   * Derive escrow address for initialization
   * The actual transaction should be signed and sent by the frontend
   * This method returns the expected escrow PDA address
   */
  async createEscrow(ownerWallet: string, amount: number): Promise<{ escrowAddress: string; expectedAmount: number }> {
    const owner = new PublicKey(ownerWallet)
    const [escrowPDA, bump] = await this.deriveEscrowAddress(owner)

    return {
      escrowAddress: escrowPDA.toString(),
      expectedAmount: amount,
    }
  }

  /**
   * Get escrow account data
   */
  async getEscrowData(escrowAddress: string): Promise<{ owner: string; escrowAmount: number } | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(escrowAddress))
      if (!accountInfo) {
        console.log(`[getEscrowData] Account not found for ${escrowAddress}`)
        return null
      }

      // CRITICAL: Check if the account is owned by our program.
      // If not, it's not a valid escrow account.
      if (!accountInfo.owner.equals(PROGRAM_ID)) {
        console.error(`[getEscrowData] Account ${escrowAddress} is owned by the wrong program.
          Expected: ${PROGRAM_ID.toBase58()}
          Got: ${accountInfo.owner.toBase58()}`)
        return null
      }

      // Parse account data (8 bytes discriminator + 32 bytes owner + 8 bytes amount)
      const data = accountInfo.data
      if (data.length < 48) {
        console.error(`[getEscrowData] Account data is too short. Expected 48, got ${data.length}`)
        return null
      }

      const owner = new PublicKey(data.slice(8, 40))
      // This is the 'virtual' amount stored in the account's state
      const escrowAmount = Number(data.readBigUInt64LE(40))

      return {
        owner: owner.toString(),
        escrowAmount,
      }
    } catch (error) {
      console.error('Failed to get escrow data:', error)
      return null
    }
  }

  /**
   * Verify escrow has sufficient balance for payment
   */
  async verifyEscrowBalance(escrowAddress: string, requiredAmount: number): Promise<boolean> {
    const escrowData = await this.getEscrowData(escrowAddress)
    if (!escrowData) return false
    return escrowData.escrowAmount >= requiredAmount
  }

  /**
   * Get remaining escrow balance for withdrawal
   */
  async getEscrowBalance(escrowAddress: string): Promise<number> {
    const escrowData = await this.getEscrowData(escrowAddress)
    return escrowData?.escrowAmount || 0
  }

  /**
   * Calculate platform fee
   */
  calculatePlatformFee(amount: number): number {
    return Math.floor((amount * PLATFORM_FEE_BPS) / 10000)
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection
  }
}

// Export singleton instance
export const solanaService = new SolanaService()
