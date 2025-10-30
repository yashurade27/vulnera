import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { solanaService, PROGRAM_ID } from '@/lib/solana'

const releasePaymentSchema = z.object({
  submissionId: z.string().min(1),
  customAmount: z.number().positive().optional() // optional custom amount in lamports
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
    const { submissionId, customAmount } = releasePaymentSchema.parse(body)

    // Fetch submission with related data
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: {
          include: {
            company: true
          }
        },
        user: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if user has permission
    const companyMember = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: submission.companyId,
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

    if (submission.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Submission must be approved before payment' },
        { status: 400 }
      )
    }

    if (submission.paymentId) {
      return NextResponse.json(
        { error: 'Payment already processed for this submission' },
        { status: 400 }
      )
    }

    if (!submission.bounty.escrowAddress) {
      return NextResponse.json(
        { error: 'Bounty escrow not initialized' },
        { status: 400 }
      )
    }

    if (!submission.user.walletAddress) {
      return NextResponse.json(
        { error: 'Hunter wallet address not set' },
        { status: 400 }
      )
    }

    // Get current paid submissions count
    const paidSubmissionsCount = await prisma.submission.count({
      where: {
        bountyId: submission.bountyId,
        status: 'APPROVED',
        paymentId: { not: null }
      }
    })

    // Check max submissions limit
    if (submission.bounty.maxSubmissions && paidSubmissionsCount >= submission.bounty.maxSubmissions) {
      return NextResponse.json(
        { error: 'Maximum submissions reached for this bounty' },
        { status: 400 }
      )
    }

    const rewardAmount = customAmount || Number(submission.rewardAmount || submission.bounty.rewardAmount) * 1_000_000_000
    const platformFee = solanaService.calculatePlatformFee(rewardAmount)
    const hunterAmount = rewardAmount - platformFee

    // Verify escrow has sufficient balance
    const hasSufficientBalance = await solanaService.verifyEscrowBalance(
      submission.bounty.escrowAddress,
      rewardAmount
    )

    if (!hasSufficientBalance) {
      return NextResponse.json(
        { error: 'Insufficient funds in escrow' },
        { status: 400 }
      )
    }

    // Return payment parameters for the smart contract call
    return NextResponse.json({
      success: true,
      paymentParams: {
        programId: PROGRAM_ID.toString(),
        bountyId: submission.bountyId,
        submissionId: submission.id,
        escrowAddress: submission.bounty.escrowAddress,
        ownerWallet: submission.bounty.company.walletAddress,
        hunterWallet: submission.user.walletAddress,
        platformWallet: process.env.PLATFORM_WALLET || 'GbLLTkUjCznwRrkLM6tewimmW6ZCC4AP8eF9yAD8e5qT',
        customAmount: customAmount || null,
        rewardPerSubmission: Number(submission.bounty.rewardAmount) * 1_000_000_000,
        maxSubmissions: submission.bounty.maxSubmissions || 999999,
        currentPaidSubmissions: paidSubmissionsCount
      },
      amounts: {
        totalAmount: rewardAmount,
        hunterAmount,
        platformFee
      },
      message: 'Payment parameters prepared. Please sign and send the process_payment transaction from your wallet.'
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
