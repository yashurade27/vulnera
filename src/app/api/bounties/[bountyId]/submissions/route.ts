import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { bountyId: string } }
) {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        bountyId: params.bountyId,
      },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}