import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { solanaService } from '@/lib/solana'

const withdrawEscrowSchema = z.object({
  bountyId: z.string().min(1),
  escrowAddress: z.string().min(32).max(44),
  ownerWallet: z.string().min(32).max(44)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bountyId, escrowAddress, ownerWallet } = withdrawEscrowSchema.parse(body)

    // Withdraw remaining funds (placeholder implementation)
    const result = await solanaService.withdrawEscrow(escrowAddress, ownerWallet)

    return NextResponse.json({
      success: true,
      txSignature: result.txSignature,
      bountyId,
      escrowAddress,
      ownerWallet,
      withdrawnAmount: result.amount
    })
  } catch (error) {
    console.error('Withdraw escrow error:', error)

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
