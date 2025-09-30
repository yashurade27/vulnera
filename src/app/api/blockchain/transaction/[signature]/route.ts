import { NextRequest, NextResponse } from 'next/server'
import { solanaService } from '@/lib/solana'

interface RouteParams {
  params: {
    signature: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { signature } = params

    if (!signature || signature.length !== 88) {
      return NextResponse.json(
        { error: 'Invalid transaction signature' },
        { status: 400 }
      )
    }

    const transaction = await solanaService.getTransaction(signature)

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
