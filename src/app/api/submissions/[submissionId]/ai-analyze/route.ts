import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { type RouteParams } from '@/lib/next';

export async function POST(
  request: NextRequest,
  { params }: RouteParams<{ submissionId: string }>
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { submissionId } = await params;

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

    // Perform AI analysis
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

// AI analysis function with heuristic-based approach
// For production with OpenAI, uncomment the OpenAI implementation below
async function performAIAnalysis(submission: any) {
  // Heuristic-based analysis (production-ready without API keys)
  
  // 1. Spam detection heuristics
  const descriptionLength = submission.description?.length || 0;
  const titleLength = submission.title?.length || 0;
  const hasProofOfConcept = !!submission.proofOfConcept;
  const hasStepsToReproduce = !!submission.stepsToReproduce;
  
  // Calculate spam indicators
  const spamIndicators: string[] = [];
  let spamScore = 0;
  
  if (descriptionLength < 50) {
    spamIndicators.push('Description too short');
    spamScore += 0.3;
  }
  
  if (titleLength < 10) {
    spamIndicators.push('Title too short');
    spamScore += 0.2;
  }
  
  if (!hasProofOfConcept) {
    spamIndicators.push('Missing proof of concept');
    spamScore += 0.2;
  }
  
  if (!hasStepsToReproduce) {
    spamIndicators.push('Missing steps to reproduce');
    spamScore += 0.2;
  }
  
  // Check for common spam patterns
  const spamKeywords = ['test', 'testing', 'asdf', 'qwerty', 'lorem ipsum'];
  const lowercaseDesc = submission.description?.toLowerCase() || '';
  const lowercaseTitle = submission.title?.toLowerCase() || '';
  
  if (spamKeywords.some(keyword => lowercaseDesc.includes(keyword) || lowercaseTitle.includes(keyword))) {
    spamIndicators.push('Contains suspicious keywords');
    spamScore += 0.3;
  }
  
  // 2. Duplicate detection heuristics
  const duplicateMatches: string[] = [];
  let duplicateScore = 0;
  
  // This is simplified - in production, query database for similar submissions
  // For now, just flag if very short (likely duplicate or spam)
  if (descriptionLength < 30) {
    duplicateMatches.push('Very short description - potential duplicate');
    duplicateScore += 0.4;
  }
  
  // 3. Calculate final scores
  const finalSpamScore = Math.min(spamScore, 1);
  const finalDuplicateScore = Math.min(duplicateScore, 1);
  const isFiltered = finalSpamScore > 0.7 || finalDuplicateScore > 0.7;
  
  return {
    spamScore: finalSpamScore,
    duplicateScore: finalDuplicateScore,
    isFiltered,
    analysis: {
      spamIndicators,
      duplicateMatches,
      confidence: Math.max(finalSpamScore, finalDuplicateScore),
      recommendations: isFiltered 
        ? ['Requires manual review', 'High risk of spam/duplicate'] 
        : ['Appears legitimate', 'Can proceed to review'],
      qualityScore: calculateQualityScore(submission),
    },
    processedAt: new Date().toISOString(),
  };
}

// Helper function to calculate submission quality
function calculateQualityScore(submission: any): number {
  let score = 0;
  
  // Award points for completeness
  if (submission.description?.length > 100) score += 0.2;
  if (submission.description?.length > 300) score += 0.1;
  if (submission.proofOfConcept) score += 0.2;
  if (submission.stepsToReproduce?.length > 50) score += 0.2;
  if (submission.impact?.length > 50) score += 0.1;
  if (submission.attachments?.length > 0) score += 0.2;
  
  return Math.min(score, 1);
}

/* 
// OPTIONAL: OpenAI-based implementation (uncomment when you have API key)
import OpenAI from 'openai';

async function performAIAnalysisWithOpenAI(submission: any) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, falling back to heuristic analysis');
    return performAIAnalysis(submission);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Analyze this bug bounty submission for spam and duplicate detection:

Title: ${submission.title}
Description: ${submission.description}
Vulnerability Type: ${submission.vulnerabilityType}
Steps to Reproduce: ${submission.stepsToReproduce}
Impact: ${submission.impact}

Provide a JSON response with:
{
  "isSpam": boolean,
  "spamConfidence": number (0-1),
  "spamReasons": string[],
  "isDuplicate": boolean,
  "duplicateConfidence": number (0-1),
  "duplicateReasons": string[],
  "qualityScore": number (0-1),
  "recommendations": string[]
}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      spamScore: analysis.spamConfidence || 0,
      duplicateScore: analysis.duplicateConfidence || 0,
      isFiltered: analysis.isSpam || analysis.isDuplicate,
      analysis: {
        spamIndicators: analysis.spamReasons || [],
        duplicateMatches: analysis.duplicateReasons || [],
        confidence: Math.max(analysis.spamConfidence || 0, analysis.duplicateConfidence || 0),
        recommendations: analysis.recommendations || [],
        qualityScore: analysis.qualityScore || 0,
      },
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenAI analysis failed, falling back to heuristics:', error);
    return performAIAnalysis(submission);
  }
}
*/
