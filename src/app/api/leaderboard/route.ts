
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        totalEarnings: "desc",
      },
      take: 100, // Limit to top 100 users
    })

    const leaderboard = users.map((user, index) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      country: user.country,
      totalEarnings: Number(user.totalEarnings),
      totalBounties: user.totalBounties,
      reputation: user.reputation,
      rank: index + 1,
      createdAt: user.createdAt.toISOString(),
    }))

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
