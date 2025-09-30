import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { solanaService } from '@/lib/solana'

const releasePaymentSchema = z.object({
  bountyId: z.string().min(1),
  submissionId: z.string().min(1),
  escrowAddress: z.string().min(32).max(44),
  recipientWallet: z.string().min(32).max(44),
  amount: z.number().positive() // amount in lamports
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bountyId, submissionId, escrowAddress, recipientWallet, amount } = releasePaymentSchema.parse(body)

    // Calculate platform fee
    const platformFee = solanaService.calculatePlatformFee(amount)
    const hunterAmount = amount - platformFee

    // Release payment (placeholder implementation)
    const result = await solanaService.releasePayment(escrowAddress, recipientWallet, amount)

    return NextResponse.json({
      success: true,
      txSignature: result.txSignature,
      bountyId,
      submissionId,
      recipientWallet,
      amount: hunterAmount,
      platformFee,
      totalDeducted: amount
    })
  } catch (error) {
    console.error('Release payment error:', error)

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
