import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

const statusSchema = {
  PATCH: async (request: NextRequest, params: { bountyId: string }) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bountyId } = params
    const { status } = await request.json()
    if (!['ACTIVE','CLOSED','EXPIRED','DRAFT'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check permissions
    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } })
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }
    const membership = await prisma.companyMember.findFirst({
      where: { userId: session.user.id, companyId: bounty.companyId, isActive: true }
    })
    if (!membership && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update status
    const updated = await prisma.bounty.update({ where: { id: bountyId }, data: { status } })
    return NextResponse.json({ bounty: updated })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bountyId: string } }
) {
  return statusSchema.PATCH(request, params)
}