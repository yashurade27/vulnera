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
    console.log('[CreateEscrow] Checking wallet balance for:', ownerWallet)
    const balance = await solanaService.getBalance(ownerWallet)
    console.log('[CreateEscrow] Wallet balance:', { balance, required: amount, sufficient: balance >= amount })
    
    if (balance < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance in wallet',
          details: `Wallet has ${balance} lamports, but ${amount} lamports required`
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
    console.error('Full error details:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
