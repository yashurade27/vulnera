import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { bountyId: string } }
) {
  try {
    const bounty = await prisma.bounty.findUnique({
      where: {
        id: params.bountyId,
      },
      include: {
        company: true,
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!bounty) {
      return new NextResponse("Bounty not found", { status: 404 })
    }

    const bountyWithNumberReward = {
      ...bounty,
      rewardAmount: Number(bounty.rewardAmount),
    }

    return NextResponse.json(bountyWithNumberReward)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}