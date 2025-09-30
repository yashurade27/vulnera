import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { solanaService, MIN_ESCROW_AMOUNT } from '@/lib/solana'

const createEscrowSchema = z.object({
  bountyId: z.string().min(1),
  ownerWallet: z.string().min(32).max(44),
  amount: z.number().positive().min(MIN_ESCROW_AMOUNT / 1_000_000_000) // amount in SOL
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bountyId, ownerWallet, amount } = createEscrowSchema.parse(body)

    // Convert SOL to lamports
    const amountLamports = Math.floor(amount * 1_000_000_000)

    if (amountLamports < MIN_ESCROW_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum escrow amount is ${MIN_ESCROW_AMOUNT / 1_000_000_000} SOL` },
        { status: 400 }
      )
    }

    // Check if owner has sufficient balance
    const balance = await solanaService.getBalance(ownerWallet)
    if (balance < amountLamports) {
      return NextResponse.json(
        { error: 'Insufficient balance in wallet' },
        { status: 400 }
      )
    }

    // Create escrow (placeholder implementation)
    const result = await solanaService.createEscrow(ownerWallet, amountLamports)

    return NextResponse.json({
      success: true,
      escrowAddress: result.escrowAddress,
      txSignature: result.txSignature,
      amount: amountLamports,
      bountyId
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
