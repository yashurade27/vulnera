import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { solanaService, PROGRAM_ID } from '@/lib/solana'

const withdrawEscrowSchema = z.object({
  bountyId: z.string().min(1)
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
    const { bountyId } = withdrawEscrowSchema.parse(body)

    // Fetch bounty with company data
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

    // Check permissions
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

    if (bounty.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Bounty must be closed before withdrawing escrow' },
        { status: 400 }
      )
    }

    if (!bounty.escrowAddress) {
      return NextResponse.json(
        { error: 'No escrow address found for this bounty' },
        { status: 400 }
      )
    }

    // Get remaining balance in escrow
    const remainingBalance = await solanaService.getEscrowBalance(bounty.escrowAddress)

    if (remainingBalance === 0) {
      return NextResponse.json(
        { error: 'No funds remaining in escrow' },
        { status: 400 }
      )
    }

    // Return parameters for the close_bounty call
    return NextResponse.json({
      success: true,
      withdrawParams: {
        programId: PROGRAM_ID.toString(),
        bountyId: bounty.id,
        escrowAddress: bounty.escrowAddress,
        ownerWallet: bounty.company.walletAddress,
        remainingAmount: remainingBalance
      },
      message: 'Withdrawal parameters prepared. Please sign and send the close_bounty transaction from your wallet.'
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
