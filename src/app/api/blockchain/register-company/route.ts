import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerCompanyOnChainSchema } from "@/lib/types"
import { solanaService } from "@/lib/solana"
import { isValidTxSignature } from "@/lib/blockchain-helpers"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  const rawBody = (await request.json()) as unknown
  const parsed = registerCompanyOnChainSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      )
    }

    const { companyId, txSignature, smartContractAddress } = parsed.data

    if (!isValidTxSignature(txSignature)) {
      return NextResponse.json({ error: "Invalid transaction signature" }, { status: 400 })
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        isVerified: true,
        smartContractAddress: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN") {
      const membership = await prisma.companyMember.findFirst({
        where: {
          companyId,
          userId: session.user.id,
          isActive: true,
        },
      })

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const verification = await solanaService.verifyTransaction(txSignature)

    if (!verification.confirmed) {
      return NextResponse.json(
        {
          error: "Transaction not confirmed on-chain",
          verification,
        },
        { status: 400 },
      )
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        smartContractAddress: smartContractAddress ?? company.smartContractAddress,
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        smartContractAddress: true,
        walletAddress: true,
        isVerified: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ company: updatedCompany, verification })
  } catch (error) {
    console.error("Register company on-chain error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
