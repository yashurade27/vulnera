import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { solanaService } from '@/lib/solana'

const verifyTransactionSchema = z.object({
  signature: z.string().length(88) // Solana signatures are 88 characters base58
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signature } = verifyTransactionSchema.parse(body)

    const result = await solanaService.verifyTransaction(signature)

    return NextResponse.json({
      success: true,
      signature,
      ...result
    })
  } catch (error) {
    console.error('Verify transaction error:', error)

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
