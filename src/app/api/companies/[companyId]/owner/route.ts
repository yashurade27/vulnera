import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params

  const member = await prisma.companyMember.findFirst({
    where: { companyId, role: UserRole.COMPANY_ADMIN, isActive: true },
    select: { userId: true },
  })

  if (!member) {
    return NextResponse.json({ error: 'Company admin not found' }, { status: 404 })
  }

  return NextResponse.json({ userId: member.userId })
}