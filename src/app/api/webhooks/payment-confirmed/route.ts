import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { paymentConfirmedWebhookSchema, type PaymentConfirmedWebhookInput } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, txSignature, confirmed, confirmations = 0, blockTime } = paymentConfirmedWebhookSchema.parse(body)

    // Find payment by ID
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
      console.warn(`Payment not found: ${paymentId}`)
      return NextResponse.json(
        { message: 'Webhook received - payment not found' },
        { status: 200 }
      )
    }

    // Update payment based on confirmation status
    const updateData: any = {
      blockchainConfirmed: confirmed,
      confirmations,
    }

    if (confirmed) {
      updateData.status = 'COMPLETED'
      updateData.completedAt = new Date()
      // Update txSignature if provided and different
      if (txSignature && txSignature !== payment.txSignature) {
        updateData.txSignature = txSignature
      }
    } else {
      updateData.status = 'FAILED'
      updateData.failureReason = 'Payment confirmation failed'
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    })

    // Create notifications if payment is confirmed
    if (confirmed) {
      // Notification for bounty hunter
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Confirmed',
          message: `Congratulations! Your payment of ${payment.netAmount} SOL for "${payment.submission?.title}" has been confirmed and is now available in your wallet.`,
          type: 'PAYMENT',
          actionUrl: `/account/payments/${payment.id}`,
        },
      })

      // Notification for company (find an admin user for the company)
      const companyAdmin = await prisma.companyMember.findFirst({
        where: {
          companyId: payment.companyId,
          role: 'COMPANY_ADMIN',
          isActive: true,
        },
        include: {
          user: true,
        },
      })

      if (companyAdmin) {
        await prisma.notification.create({
          data: {
            userId: companyAdmin.userId,
            title: 'Payment Processed',
            message: `Payment of ${payment.amount} SOL for submission "${payment.submission?.title}" has been successfully processed.`,
            type: 'PAYMENT',
            actionUrl: `/company/payments/${payment.id}`,
          },
        })
      }
    }

    // Log the webhook event
    console.log(`Payment confirmation webhook processed: ${paymentId} - ${confirmed ? 'confirmed' : 'failed'}`)

    return NextResponse.json({
      message: 'Payment confirmation webhook processed successfully',
      paymentId: payment.id,
      status: updatedPayment.status,
      confirmed,
    })

  } catch (error) {
    console.error('Payment confirmation webhook error:', error)

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
