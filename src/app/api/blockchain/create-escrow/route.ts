import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { solanaService, MIN_ESCROW_AMOUNT } from '@/lib/solana'

const createEscrowSchema = z.object({
  ownerWallet: z.string().min(32).max(44),
  amount: z.number().positive() // amount in lamports
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ownerWallet, amount } = createEscrowSchema.parse(body)

    if (amount < MIN_ESCROW_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum escrow amount is ${MIN_ESCROW_AMOUNT} lamports (${MIN_ESCROW_AMOUNT / 1_000_000_000} SOL)` },
        { status: 400 }
      )
    }

    // Check if owner has sufficient balance
    // Adding buffer for transaction fees (roughly 0.001 SOL = 1,000,000 lamports)
    const TRANSACTION_FEE_BUFFER = 1_000_000
    const balance = await solanaService.getBalance(ownerWallet)
    const requiredBalance = amount + TRANSACTION_FEE_BUFFER
    
    if (balance < requiredBalance) {
      const balanceInSOL = (balance / 1_000_000_000).toFixed(4)
      const requiredInSOL = (requiredBalance / 1_000_000_000).toFixed(4)
      return NextResponse.json(
        { 
          error: `Insufficient balance. You have ${balanceInSOL} SOL but need ${requiredInSOL} SOL (including transaction fees)`,
          balance,
          required: requiredBalance
        },
        { status: 400 }
      )
    }

    // Derive the PDA escrow address that will be created
    const result = await solanaService.createEscrow(ownerWallet, amount)

    return NextResponse.json({
      success: true,
      escrowAddress: result.escrowAddress,
      expectedAmount: result.expectedAmount,
      message: 'Escrow address derived. Please sign and send the initialize transaction from your wallet.'
    })
  } catch (error) {
    console.error('Create escrow error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
