import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { submissionId } = params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        bounty: true,
        user: true,
        company: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check permissions - only company admins or admins can trigger AI analysis
    if (session.user.role !== 'ADMIN') {
      if (session.user.role !== 'COMPANY_ADMIN') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      const membership = await prisma.companyMember.findFirst({
        where: {
          userId: session.user.id,
          companyId: submission.companyId,
          isActive: true,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // TODO: Implement actual AI analysis
    // For now, return mock analysis results
    const aiAnalysisResult = await performAIAnalysis(submission);

    // Update submission with AI analysis results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        aiSpamScore: aiAnalysisResult.spamScore,
        aiDuplicateScore: aiAnalysisResult.duplicateScore,
        aiAnalysisResult,
        isAiFiltered: aiAnalysisResult.isFiltered,
      },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      submission: updatedSubmission,
      aiAnalysis: aiAnalysisResult,
    });

  } catch (error) {
    console.error('AI analyze error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock AI analysis function
// In production, this would call an actual AI service
async function performAIAnalysis(submission: any) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock analysis based on submission content
  const spamScore = Math.random();
  const duplicateScore = Math.random();

  // Simple heuristics for demo
  const isSpam = spamScore > 0.8 || submission.description.length < 10;
  const isDuplicate = duplicateScore > 0.7;

  return {
    spamScore,
    duplicateScore,
    isFiltered: isSpam || isDuplicate,
    analysis: {
      spamIndicators: isSpam ? ['Short description', 'Suspicious content'] : [],
      duplicateMatches: isDuplicate ? ['Similar submission found'] : [],
      confidence: Math.max(spamScore, duplicateScore),
      recommendations: isSpam || isDuplicate ? ['Review manually'] : ['Auto-approve'],
    },
    processedAt: new Date().toISOString(),
  };
}
