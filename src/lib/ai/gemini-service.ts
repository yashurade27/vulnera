import { GoogleGenerativeAI } from "@google/generative-ai"

export interface VulnerabilityAnalysis {
  overallScore: number // 0-100
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  confidence: number // 0-100
  spamProbability: number // 0-100
  duplicateLikelihood: number // 0-100
  legitimacyScore: number // 0-100
  technicalDepth: number // 0-100
  exploitability: number // 0-100
  impactScore: number // 0-100
  summary: string
  keyFindings: string[]
  riskFactors: string[]
  recommendations: string[]
  detailedAnalysis: {
    descriptionQuality: number
    reproducibilityClarity: number
    impactAssessment: number
    proofOfConceptQuality: number
  }
}

interface SubmissionData {
  title: string
  description: string
  vulnerabilityType: string
  stepsToReproduce: string
  impact: string
  proofOfConcept?: string | null
  bountyType: string
}

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured")
    }
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  }

  async analyzeSubmission(submission: SubmissionData): Promise<VulnerabilityAnalysis> {
    const prompt = this.buildAnalysisPrompt(submission)

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response")
      }

      const analysis = JSON.parse(jsonMatch[0]) as VulnerabilityAnalysis
      return this.normalizeAnalysis(analysis)
    } catch (error) {
      console.error("Gemini API error:", error)
      throw new Error("Failed to analyze submission with AI")
    }
  }

  private buildAnalysisPrompt(submission: SubmissionData): string {
    return `You are a security expert reviewing a vulnerability submission. Analyze the following submission and provide a comprehensive assessment in JSON format.

**Submission Details:**
Title: ${submission.title}
Vulnerability Type: ${submission.vulnerabilityType}
Bounty Type: ${submission.bountyType}

Description:
${submission.description}

Steps to Reproduce:
${submission.stepsToReproduce}

Impact:
${submission.impact}

${submission.proofOfConcept ? `Proof of Concept:\n${submission.proofOfConcept}` : "No proof of concept provided."}

**Analysis Requirements:**
Provide a detailed analysis with the following metrics (all scores 0-100):

1. **overallScore**: Overall quality and severity assessment
2. **severityLevel**: One of "LOW", "MEDIUM", "HIGH", or "CRITICAL"
3. **confidence**: How confident you are in this assessment
4. **spamProbability**: Likelihood this is spam or low-quality submission (0 = legitimate, 100 = definitely spam)
5. **duplicateLikelihood**: Probability this is a duplicate of common issues
6. **legitimacyScore**: How legitimate and well-researched this appears (0 = fake, 100 = highly credible)
7. **technicalDepth**: Level of technical detail and understanding shown
8. **exploitability**: How easily this vulnerability can be exploited
9. **impactScore**: Potential business/security impact
10. **summary**: 2-3 sentence executive summary
11. **keyFindings**: Array of 3-5 key findings
12. **riskFactors**: Array of 3-5 risk factors to consider
13. **recommendations**: Array of 3-5 actionable recommendations
14. **detailedAnalysis**: Object with:
    - descriptionQuality (0-100)
    - reproducibilityClarity (0-100)
    - impactAssessment (0-100)
    - proofOfConceptQuality (0-100)

**Scoring Guidelines:**
- Low quality/spam submissions: overallScore 0-30, high spamProbability
- Questionable submissions: overallScore 30-50
- Valid minor issues: overallScore 50-70, severityLevel "LOW" or "MEDIUM"
- Significant vulnerabilities: overallScore 70-85, severityLevel "HIGH"
- Critical vulnerabilities: overallScore 85-100, severityLevel "CRITICAL"

Return ONLY valid JSON matching this exact structure:
{
  "overallScore": number,
  "severityLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": number,
  "spamProbability": number,
  "duplicateLikelihood": number,
  "legitimacyScore": number,
  "technicalDepth": number,
  "exploitability": number,
  "impactScore": number,
  "summary": "string",
  "keyFindings": ["string", "string", ...],
  "riskFactors": ["string", "string", ...],
  "recommendations": ["string", "string", ...],
  "detailedAnalysis": {
    "descriptionQuality": number,
    "reproducibilityClarity": number,
    "impactAssessment": number,
    "proofOfConceptQuality": number
  }
}`
  }

  private normalizeAnalysis(analysis: VulnerabilityAnalysis): VulnerabilityAnalysis {
    // Ensure all scores are within 0-100 range
    const clamp = (value: number) => Math.min(100, Math.max(0, value))

    return {
      ...analysis,
      overallScore: clamp(analysis.overallScore),
      confidence: clamp(analysis.confidence),
      spamProbability: clamp(analysis.spamProbability),
      duplicateLikelihood: clamp(analysis.duplicateLikelihood),
      legitimacyScore: clamp(analysis.legitimacyScore),
      technicalDepth: clamp(analysis.technicalDepth),
      exploitability: clamp(analysis.exploitability),
      impactScore: clamp(analysis.impactScore),
      detailedAnalysis: {
        descriptionQuality: clamp(analysis.detailedAnalysis.descriptionQuality),
        reproducibilityClarity: clamp(analysis.detailedAnalysis.reproducibilityClarity),
        impactAssessment: clamp(analysis.detailedAnalysis.impactAssessment),
        proofOfConceptQuality: clamp(analysis.detailedAnalysis.proofOfConceptQuality),
      },
    }
  }
}
