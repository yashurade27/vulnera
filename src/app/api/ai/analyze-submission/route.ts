import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GeminiService } from "@/lib/ai/gemini-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId } = body

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    // Fetch the submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: {
          include: {
            company: true,
          },
        },
        user: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check if user has permission to analyze (company owner or admin)
    const userRole = session.user.role
    const canAnalyze = userRole === "ADMIN" || userRole === "COMPANY_ADMIN"

    if (!canAnalyze) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Initialize Gemini service
    const geminiService = new GeminiService()

    // Analyze the submission
    const analysis = await geminiService.analyzeSubmission({
      title: submission.title,
      description: submission.description,
      vulnerabilityType: submission.vulnerabilityType,
      stepsToReproduce: submission.stepsToReproduce,
      impact: submission.impact,
      proofOfConcept: submission.proofOfConcept,
      bountyType: submission.bountyType,
    })

    // Update the submission with AI analysis
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        aiAnalysisResult: analysis as any,
        aiSpamScore: analysis.spamProbability / 100,
        aiDuplicateScore: analysis.duplicateLikelihood / 100,
      },
    })

    return NextResponse.json({
      success: true,
      analysis,
      submission: updatedSubmission,
    })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze submission" },
      { status: 500 }
    )
  }
}
