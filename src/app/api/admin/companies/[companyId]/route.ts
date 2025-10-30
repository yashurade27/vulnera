import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { type RouteParams } from '@/lib/next'

const updateCompanyByAdminSchema = z.object({
  reputation: z
    .number()
    .min(0, { message: 'Reputation cannot be negative' })
    .max(10000, { message: 'Reputation too high' })
    .optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams<{ companyId: string }>
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

  const { companyId } = await params
    const body = await request.json()
    const parsed = updateCompanyByAdminSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        website: true,
        logoUrl: true,
        walletAddress: true,
        smartContractAddress: true,
        industry: true,
        companySize: true,
        location: true,
        totalBountiesFunded: true,
        totalBountiesPaid: true,
        activeBounties: true,
        resolvedVulnerabilities: true,
        reputation: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ company: updatedCompany })
  } catch (error) {
    console.error('Update company by admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
