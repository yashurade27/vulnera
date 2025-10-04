import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = parseInt(searchParams.get("offset") || "0")
  const sortBy = searchParams.get("sortBy") || "createdAt"
  const sortOrder = searchParams.get("sortOrder") || "desc"
  const search = searchParams.get("search")
  const type = searchParams.get("type")
  const minReward = searchParams.get("minReward")
  const maxReward = searchParams.get("maxReward")

  const where: any = {
    status: status ? { equals: status } : undefined,
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  if (type) {
    where.bountyType = { equals: type }
  }

  if (minReward) {
    where.rewardAmount = { gte: parseFloat(minReward) }
  }

  if (maxReward) {
    where.rewardAmount = { ...where.rewardAmount, lte: parseFloat(maxReward) }
  }

  try {
    const bounties = await prisma.bounty.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    })

    const total = await prisma.bounty.count({ where })

    const bountiesWithNumberRewards = bounties.map((bounty) => ({
      ...bounty,
      rewardAmount: Number(bounty.rewardAmount),
    }))

    return NextResponse.json({
      bounties: bountiesWithNumberRewards,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}