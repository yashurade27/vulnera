import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { solanaService, PROGRAM_ID } from '@/lib/solana'

const depositSchema = z.object({
  bountyId: z.string().min(1),
  txSignature: z.string().min(1),
  amount: z.number().positive() // amount in lamports
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
    const { bountyId, txSignature, amount } = depositSchema.parse(body)

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

    // Verify transaction on blockchain
    const txVerification = await solanaService.verifyTransaction(txSignature)
    
    if (!txVerification.confirmed) {
      return NextResponse.json(
        { error: 'Transaction not confirmed on blockchain' },
        { status: 400 }
      )
    }

    // Wait for RPC to catch up and verify new escrow balance
    let updatedEscrowData: { owner: string; escrowAmount: number; } | null = null
    for (let i = 0; i < 5; i++) {
      updatedEscrowData = await solanaService.getEscrowData(bounty.escrowAddress)
      if (updatedEscrowData) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (!updatedEscrowData) {
      return NextResponse.json(
        { error: 'Could not verify updated escrow balance' },
        { status: 400 }
      )
    }

    // Update company stats - add to total funded amount
    const amountInSOL = amount / 1_000_000_000
    await prisma.company.update({
      where: { id: bounty.companyId },
      data: {
        totalBountiesFunded: { increment: amountInSOL }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BOUNTY_DEPOSIT',
        entityType: 'BOUNTY',
        entityId: bountyId,
        newValue: { 
          txSignature, 
          depositAmount: amount,
          newEscrowBalance: updatedEscrowData.escrowAmount
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Funds deposited successfully',
      deposit: {
        bountyId,
        txSignature,
        depositAmount: amount,
        newEscrowBalance: updatedEscrowData.escrowAmount
      }
    })

  } catch (error) {
    console.error('Deposit error:', error)

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
