import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { solanaService } from '@/lib/solana'

const verifyWalletSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string(),
  message: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, message } = verifyWalletSchema.parse(body)

    const isValid = await solanaService.verifyWallet(walletAddress, signature, message)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature or wallet address' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      verified: true,
      walletAddress
    })
  } catch (error) {
    console.error('Wallet verification error:', error)

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
