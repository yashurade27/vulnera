import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'
import * as nacl from 'tweetnacl'

// Solana RPC endpoint - use environment variable or default to devnet
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Platform wallet address for fees - should be set in environment
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '11111111111111111111111111111112'

// Minimum escrow amount (0.1 SOL)
export const MIN_ESCROW_AMOUNT = 0.1 * LAMPORTS_PER_SOL

// Platform fee (2%)
export const PLATFORM_FEE_BPS = 200 // basis points

export class SolanaService {
  private connection: Connection

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed')
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
        maxSupportedTransactionVersion: 0
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
        recentBlockhash: tx.transaction.message.recentBlockhash
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
        commitment: 'confirmed'
      })

      if (!tx) {
        return { confirmed: false }
      }

      return {
        confirmed: !tx.meta?.err,
        blockTime: tx.blockTime ?? undefined,
        status: tx.meta?.err ? 'failed' : 'confirmed'
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
   * Create a simple escrow transfer (temporary implementation)
   * In production, this should use the Anchor program
   */
  async createEscrow(ownerWallet: string, amount: number): Promise<{ escrowAddress: string; txSignature: string }> {
    // For now, create a temporary escrow account
    // This is a placeholder - should be replaced with Anchor program call
    const owner = new PublicKey(ownerWallet)
    const escrowKeypair = new PublicKey(ownerWallet) // Placeholder - generate proper escrow address

    return {
      escrowAddress: escrowKeypair.toString(),
      txSignature: 'placeholder_tx_signature' // This would be the actual transaction signature
    }
  }

  /**
   * Release payment from escrow
   */
  async releasePayment(
    escrowAddress: string,
    recipientWallet: string,
    amount: number
  ): Promise<{ txSignature: string }> {
    // Placeholder implementation
    // Should use Anchor program to release payment
    return {
      txSignature: 'placeholder_payment_tx'
    }
  }

  /**
   * Withdraw remaining escrow funds
   */
  async withdrawEscrow(escrowAddress: string, ownerWallet: string): Promise<{ txSignature: string; amount: number }> {
    // Placeholder implementation
    return {
      txSignature: 'placeholder_withdraw_tx',
      amount: 0
    }
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