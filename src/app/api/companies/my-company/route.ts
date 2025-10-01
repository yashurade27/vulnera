import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find active membership for user
  const membership = await prisma.companyMember.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
    }
  })
  if (!membership) {
    return NextResponse.json({ error: 'No company found for user' }, { status: 404 })
  }

  // Fetch company details
  const company = await prisma.company.findUnique({
    where: { id: membership.companyId }
  })
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  return NextResponse.json({ company })
}