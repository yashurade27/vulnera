/**
 * Blockchain Helper Functions
 * Utility functions for blockchain operations and validations
 */

import { PublicKey } from '@solana/web3.js'
import { PROGRAM_ID, MIN_ESCROW_AMOUNT, PLATFORM_FEE_BPS } from './solana'

/**
 * Validate Solana public key format
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Derive escrow PDA address
 */
export function deriveEscrowAddress(ownerPublicKey: string): [string, number] {
  try {
    const owner = new PublicKey(ownerPublicKey)
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('bounty-escrow'), owner.toBuffer()],
      PROGRAM_ID
    )
    return [pda.toString(), bump]
  } catch (error) {
    throw new Error(`Failed to derive escrow address: ${error}`)
  }
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000)
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000
}

/**
 * Calculate platform fee in lamports
 */
export function calculatePlatformFee(amountLamports: number): number {
  return Math.floor((amountLamports * PLATFORM_FEE_BPS) / 10000)
}

/**
 * Calculate net amount after platform fee
 */
export function calculateNetAmount(amountLamports: number): number {
  const fee = calculatePlatformFee(amountLamports)
  return amountLamports - fee
}

/**
 * Validate escrow amount meets minimum requirement
 */
export function isValidEscrowAmount(amountLamports: number): boolean {
  return amountLamports >= MIN_ESCROW_AMOUNT
}

/**
 * Format transaction signature for display
 */
export function formatTxSignature(signature: string, length: number = 8): string {
  if (signature.length <= length * 2) return signature
  return `${signature.slice(0, length)}...${signature.slice(-length)}`
}

/**
 * Get Solana explorer URL for transaction
 */
export function getExplorerUrl(
  signature: string,
  cluster: 'mainnet-beta' | 'testnet' | 'devnet' = 'devnet'
): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`
}

/**
 * Get Solana explorer URL for address
 */
export function getAddressExplorerUrl(
  address: string,
  cluster: 'mainnet-beta' | 'testnet' | 'devnet' = 'devnet'
): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `https://explorer.solana.com/address/${address}${clusterParam}`
}

/**
 * Validate transaction signature format
 */
export function isValidTxSignature(signature: string): boolean {
  // Solana transaction signatures are 88 characters in base58
  return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)
}

/**
 * Parse payment event from transaction logs
 */
export function parsePaymentEvent(logs: string[]): {
  bountyId?: string
  submissionId?: string
  hunterWallet?: string
  amount?: number
  platformFee?: number
} | null {
  try {
    // Look for PaymentProcessed event in logs
    const eventLog = logs.find(log => log.includes('PaymentProcessed'))
    if (!eventLog) return null

    // Parse the event data (this is a simplified example)
    // In production, you'd use the Anchor event parser
    return {
      // Extract event data from logs
    }
  } catch (error) {
    console.error('Failed to parse payment event:', error)
    return null
  }
}

/**
 * Parse bounty closed event from transaction logs
 */
export function parseBountyClosedEvent(logs: string[]): {
  bountyId?: string
  remainingAmount?: number
} | null {
  try {
    const eventLog = logs.find(log => log.includes('BountyClosed'))
    if (!eventLog) return null

    return {
      // Extract event data from logs
    }
  } catch (error) {
    console.error('Failed to parse bounty closed event:', error)
    return null
  }
}

/**
 * Estimate transaction fee for operations
 */
export function estimateTransactionFee(operation: 'initialize' | 'payment' | 'close'): number {
  // Rough estimates in lamports
  const fees = {
    initialize: 5000, // ~0.000005 SOL
    payment: 5000,
    close: 5000
  }
  return fees[operation]
}

/**
 * Check if amount covers transaction fee
 */
export function hasEnoughForFee(balanceLamports: number, amountLamports: number): boolean {
  const fee = estimateTransactionFee('payment')
  return balanceLamports >= amountLamports + fee
}

/**
 * Calculate total cost including fees
 */
export function calculateTotalCost(amountLamports: number, operation: 'initialize' | 'payment' | 'close'): number {
  const fee = estimateTransactionFee(operation)
  return amountLamports + fee
}

/**
 * Validate payment parameters
 */
export function validatePaymentParams(params: {
  escrowAmount: number
  rewardAmount: number
  currentPaidSubmissions: number
  maxSubmissions: number | null
}): { valid: boolean; error?: string } {
  const { escrowAmount, rewardAmount, currentPaidSubmissions, maxSubmissions } = params

  if (rewardAmount > escrowAmount) {
    return { valid: false, error: 'Reward amount exceeds escrow balance' }
  }

  if (maxSubmissions !== null && currentPaidSubmissions >= maxSubmissions) {
    return { valid: false, error: 'Maximum submissions limit reached' }
  }

  if (rewardAmount <= 0) {
    return { valid: false, error: 'Reward amount must be positive' }
  }

  return { valid: true }
}

/**
 * Format SOL amount for display
 */
export function formatSol(lamports: number, decimals: number = 4): string {
  const sol = lamportsToSol(lamports)
  return `${sol.toFixed(decimals)} SOL`
}
