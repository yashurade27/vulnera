import { NextResponse } from 'next/server'
import { PrismaClient, SubmissionStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function POST(req: Request, { params }: { params: { submissionId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { submissionId } = params
  const { rewardAmount, reviewNotes } = await req.json()

  if (!submissionId || !rewardAmount || typeof rewardAmount !== 'number' || rewardAmount <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: { include: { company: true } },
        user: true,
      },
    })

    if (!submission) {
      throw new Error('Submission not found')
    }

    if (!submission.user.walletAddress) {
      throw new Error('Hunter does not have a wallet address on file.')
    }

    const companyId = submission.bounty.company.id
    const userRole = await prisma.companyMember.findFirst({
      where: {
        userId: session.user.id,
        companyId: companyId,
      },
    })

    if (userRole?.role !== 'COMPANY_ADMIN' || !userRole.canApprovePayment) {
      throw new Error('Forbidden: You do not have permission to approve this submission.')
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new Error(`Submission status is already ${submission.status}`)
    }

    console.log(`Simulating transfer of ${rewardAmount} SOL to ${submission.user.walletAddress}`)
    const mockTxSignature = `mock_tx_${Date.now()}`

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.APPROVED,
        reviewNotes: reviewNotes,
        rewardAmount: rewardAmount,
        payment: {
          create: {
            amount: rewardAmount,
            status: 'COMPLETED',
            txSignature: mockTxSignature,
            companyId: companyId,
            userId: submission.userId,
            netAmount: rewardAmount,
            fromWallet: submission.bounty.company.walletAddress,
            toWallet: submission.user.walletAddress,
          },
        },
      },
      include: {
        payment: true,
      },
    })

    return NextResponse.json({
      message: 'Submission approved and payment processed.',
      txSignature: updatedSubmission.payment?.txSignature,
    })
  } catch (error) {
    console.error('Failed to approve submission:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
