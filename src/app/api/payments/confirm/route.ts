import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { solanaService, PLATFORM_FEE_BPS } from '@/lib/solana'

const confirmPaymentSchema = z.object({
  submissionId: z.string().min(1),
  txSignature: z.string().min(1)
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
    const { submissionId, txSignature } = confirmPaymentSchema.parse(body)

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

    if (submission.paymentId) {
      return NextResponse.json(
        { error: 'Payment already confirmed for this submission' },
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

    // Get transaction details
    const txDetails = await solanaService.getTransaction(txSignature)
    
    if (!txDetails) {
      return NextResponse.json(
        { error: 'Transaction details not found' },
        { status: 400 }
      )
    }

    // Calculate amounts (reconstruct from submission)
    const rewardAmount = Number(submission.rewardAmount || submission.bounty.rewardAmount)
    const amountLamports = Math.floor(rewardAmount * 1_000_000_000)
    const platformFee = Math.floor((amountLamports * PLATFORM_FEE_BPS) / 10000)
    const hunterAmount = amountLamports - platformFee

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        submissionId: submission.id,
        userId: submission.userId,
        companyId: submission.companyId,
        amount: rewardAmount,
        platformFee: platformFee / 1_000_000_000,
        netAmount: hunterAmount / 1_000_000_000,
        txSignature,
        fromWallet: submission.bounty.company.walletAddress,
        toWallet: submission.user.walletAddress || '',
        blockchainConfirmed: true,
        confirmations: 1,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    // Update submission with payment ID
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        paymentId: payment.id
      }
    })

    // Update user earnings and stats
    await prisma.user.update({
      where: { id: submission.userId },
      data: {
        totalEarnings: { increment: hunterAmount / 1_000_000_000 },
        totalBounties: { increment: 1 }
      }
    })

    // Update company stats
    await prisma.company.update({
      where: { id: submission.companyId },
      data: {
        totalBountiesPaid: { increment: rewardAmount },
        resolvedVulnerabilities: { increment: 1 }
      }
    })

    // Update bounty stats
    await prisma.bounty.update({
      where: { id: submission.bountyId },
      data: {
        paidOut: { increment: rewardAmount }
      }
    })

    // Create notification for hunter
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: 'Payment received',
        message: `You have received ${hunterAmount / 1_000_000_000} SOL for your submission "${submission.title}".`,
        type: 'PAYMENT',
        actionUrl: `/submissions/${submissionId}`
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PAYMENT_CONFIRMED',
        entityType: 'PAYMENT',
        entityId: payment.id,
        newValue: {
          txSignature,
          submissionId,
          amount: rewardAmount,
          hunterAmount: hunterAmount / 1_000_000_000,
          platformFee: platformFee / 1_000_000_000
        }
      }
    })

    return NextResponse.json({
      success: true,
      payment,
      message: 'Payment confirmed successfully'
    })

  } catch (error) {
    console.error('Confirm payment error:', error)

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
