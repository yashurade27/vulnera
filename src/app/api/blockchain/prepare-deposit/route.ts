import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PROGRAM_ID } from '@/lib/solana'

const prepareDepositSchema = z.object({
  bountyId: z.string().min(1),
  amount: z.number().positive() // amount in SOL
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bountyId, amount } = prepareDepositSchema.parse(body)

    // Fetch bounty with related data
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        company: true
      }
    })

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404 }
      )
    }

    // Check if user has permission
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: bounty.companyId,
        isActive: true,
        canApprovePayment: true
      }
    })

    if (!companyMember && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (!bounty.escrowAddress) {
      return NextResponse.json(
        { error: 'Bounty escrow not initialized. Please fund the bounty first.' },
        { status: 400 }
      )
    }

    // Check if bounty is still active
    if (bounty.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only add funds to active bounties' },
        { status: 400 }
      )
    }

    const amountLamports = Math.floor(amount * 1_000_000_000)

    // Return deposit parameters for the smart contract call
    return NextResponse.json({
      success: true,
      depositParams: {
        programId: PROGRAM_ID.toString(),
        bountyId: bounty.id,
        escrowAddress: bounty.escrowAddress,
        ownerWallet: bounty.company.walletAddress,
        amount: amountLamports
      },
      bountyDetails: {
        title: bounty.title,
        currentReward: Number(bounty.rewardAmount),
        maxSubmissions: bounty.maxSubmissions
      },
      message: 'Deposit parameters prepared. Please sign and send the deposit transaction from your wallet.'
    })

  } catch (error) {
    console.error('Prepare deposit error:', error)

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
