import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { type RouteParams } from "@/lib/next"

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ userId: string }>,
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const memberships = await prisma.companyMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        role: true,
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        joinedAt: true,
        invitedAt: true,
        company: {
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
            isVerified: true,
            isActive: true,
            totalBountiesFunded: true,
            totalBountiesPaid: true,
            activeBounties: true,
            resolvedVulnerabilities: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                bounties: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          joinedAt: "desc",
        },
        {
          invitedAt: "desc",
        },
      ],
    })

    return NextResponse.json({ memberships })
  } catch (error) {
    console.error("Get user companies error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
