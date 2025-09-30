import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { solanaWebhookSchema, type SolanaWebhookInput } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signature, status, blockTime } = solanaWebhookSchema.parse(body)

    // Find payment by transaction signature
    const payment = await prisma.payment.findUnique({
      where: { txSignature: signature },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        submission: {
          select: {
            id: true,
            title: true,
            bounty: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!payment) {
      console.warn(`Payment not found for signature: ${signature}`)
      // Return 200 to acknowledge webhook receipt even if payment not found
      return NextResponse.json(
        { message: 'Webhook received - payment not found' },
        { status: 200 }
      )
    }

    // Update payment based on webhook status
    const updateData: any = {
      blockchainConfirmed: status === 'confirmed',
      confirmations: status === 'confirmed' ? 1 : 0, // Simplified - in production might track actual confirmations
    }

    if (status === 'confirmed') {
      updateData.status = 'COMPLETED'
      updateData.completedAt = new Date()
    } else if (status === 'failed') {
      updateData.status = 'FAILED'
      updateData.failureReason = 'Transaction failed on blockchain'
    } else if (status === 'pending') {
      updateData.status = 'PROCESSING'
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    })

    // Create notification for the user if payment is completed
    if (status === 'confirmed') {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Received',
          message: `Your bounty payment of ${payment.netAmount} SOL for "${payment.submission?.title}" has been confirmed on the blockchain.`,
          type: 'PAYMENT',
          actionUrl: `/account/payments/${payment.id}`,
        },
      })

      // Create notification for company as well
      await prisma.notification.create({
        data: {
          userId: payment.companyId, // This should be a company admin user ID
          title: 'Payment Completed',
          message: `Payment of ${payment.amount} SOL for submission "${payment.submission?.title}" has been processed successfully.`,
          type: 'PAYMENT',
          actionUrl: `/company/payments/${payment.id}`,
        },
      })
    }

    // Log the webhook event
    console.log(`Solana webhook processed: ${signature} - ${status}`)

    return NextResponse.json({
      message: 'Webhook processed successfully',
      paymentId: payment.id,
      status: updatedPayment.status,
    })

  } catch (error) {
    console.error('Solana webhook error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook payload', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
