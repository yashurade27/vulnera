"use client"

import { useState } from "react"
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  FileSearch,
  Lightbulb,
  Loader2,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VulnerabilityAnalysis {
  overallScore: number
  severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  confidence: number
  spamProbability: number
  duplicateLikelihood: number
  legitimacyScore: number
  technicalDepth: number
  exploitability: number
  impactScore: number
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

interface EnhancedAIInsightsProps {
  submissionId: string
  existingAnalysis?: VulnerabilityAnalysis | null
  onAnalysisComplete?: (analysis: VulnerabilityAnalysis) => void
}

export function EnhancedAIInsights({
  submissionId,
  existingAnalysis,
  onAnalysisComplete,
}: EnhancedAIInsightsProps) {
  const [analysis, setAnalysis] = useState<VulnerabilityAnalysis | null>(
    existingAnalysis || null
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true)
      const response = await fetch("/api/ai/analyze-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ submissionId }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setAnalysis(data.analysis)
      onAnalysisComplete?.(data.analysis)
      toast.success("AI analysis completed successfully")
    } catch (error) {
      console.error("Analysis error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to analyze submission")
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!analysis) {
    return (
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            Enhanced AI Analysis
          </CardTitle>
          <CardDescription>
            Get comprehensive AI-powered insights using Gemini to evaluate this submission's
            quality, severity, and legitimacy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const severityColors = {
    LOW: {
      bg: "from-emerald-500/20 to-green-500/20",
      border: "border-emerald-500/40",
      text: "text-emerald-400",
      icon: "text-emerald-300",
    },
    MEDIUM: {
      bg: "from-yellow-500/20 to-amber-500/20",
      border: "border-yellow-500/40",
      text: "text-yellow-400",
      icon: "text-yellow-300",
    },
    HIGH: {
      bg: "from-orange-500/20 to-red-500/20",
      border: "border-orange-500/40",
      text: "text-orange-400",
      icon: "text-orange-300",
    },
    CRITICAL: {
      bg: "from-red-500/20 to-rose-500/20",
      border: "border-red-500/40",
      text: "text-red-400",
      icon: "text-red-300",
    },
  }

  const colors = severityColors[analysis.severityLevel]

  // Color functions for scores
  const getScoreColor = (score: number, invert = false) => {
    const effectiveScore = invert ? 100 - score : score
    if (effectiveScore >= 80) return "from-emerald-500 to-green-500"
    if (effectiveScore >= 60) return "from-blue-500 to-cyan-500"
    if (effectiveScore >= 40) return "from-yellow-500 to-amber-500"
    if (effectiveScore >= 20) return "from-orange-500 to-red-500"
    return "from-red-600 to-rose-600"
  }

  const getScoreTextColor = (score: number, invert = false) => {
    const effectiveScore = invert ? 100 - score : score
    if (effectiveScore >= 80) return "text-emerald-400"
    if (effectiveScore >= 60) return "text-blue-400"
    if (effectiveScore >= 40) return "text-yellow-400"
    if (effectiveScore >= 20) return "text-orange-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-4">
      <Card className={cn("card-glass", colors.border)}>
        <CardHeader className="border-b border-border/60">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                Enhanced AI Analysis
              </CardTitle>
              <CardDescription>{analysis.summary}</CardDescription>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="sm"
              variant="outline"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Re-analyze
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground tracking-wide">
                  Overall Score
                </p>
                <Shield className={cn("w-5 h-5", getScoreTextColor(analysis.overallScore))} />
              </div>
              <div className="space-y-2">
                <p className={cn("text-3xl font-bold", getScoreTextColor(analysis.overallScore))}>
                  {analysis.overallScore}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
                <Progress
                  value={analysis.overallScore}
                  className="h-2"
                  indicatorClassName={cn("bg-gradient-to-r", getScoreColor(analysis.overallScore))}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground tracking-wide">
                  Severity Level
                </p>
                <AlertTriangle className={cn("w-5 h-5", colors.icon)} />
              </div>
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className={cn("text-sm font-bold px-3 py-1", colors.text, colors.border)}
                >
                  {analysis.severityLevel}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {analysis.confidence}% confidence
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Legitimacy"
              value={analysis.legitimacyScore}
              icon={CheckCircle}
            />
            <MetricCard
              label="Tech Depth"
              value={analysis.technicalDepth}
              icon={FileSearch}
            />
            <MetricCard
              label="Exploitability"
              value={analysis.exploitability}
              icon={Zap}
              invert
            />
            <MetricCard
              label="Impact"
              value={analysis.impactScore}
              icon={TrendingUp}
              invert
            />
          </div>

          {/* Risk Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <RiskIndicator
              label="Spam Probability"
              value={analysis.spamProbability}
              icon={Copy}
              invert
            />
            <RiskIndicator
              label="Duplicate Risk"
              value={analysis.duplicateLikelihood}
              icon={Eye}
              invert
            />
          </div>

          {/* Key Findings */}
          {analysis.keyFindings.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold">Key Findings</h3>
              </div>
              <ul className="space-y-2">
                {analysis.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span className="text-foreground/90">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expandable Details */}
          <div className="space-y-3">
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              className="w-full justify-between hover:bg-card/40"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Detailed Analysis & Recommendations
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showDetails && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {/* Detailed Metrics */}
                <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Quality Breakdown</h3>
                  <div className="space-y-3">
                    <DetailedMetric
                      label="Description Quality"
                      value={analysis.detailedAnalysis.descriptionQuality}
                    />
                    <DetailedMetric
                      label="Reproducibility Clarity"
                      value={analysis.detailedAnalysis.reproducibilityClarity}
                    />
                    <DetailedMetric
                      label="Impact Assessment"
                      value={analysis.detailedAnalysis.impactAssessment}
                    />
                    <DetailedMetric
                      label="Proof of Concept"
                      value={analysis.detailedAnalysis.proofOfConceptQuality}
                    />
                  </div>
                </div>

                {/* Risk Factors */}
                {analysis.riskFactors.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <h3 className="text-sm font-semibold">Risk Factors</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.riskFactors.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-400 mt-0.5">⚠</span>
                          <span className="text-foreground/90">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-semibold">Recommendations</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span className="text-foreground/90">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  invert = false,
}: {
  label: string
  value: number
  icon: any
  invert?: boolean
}) {
  const getColor = (score: number) => {
    const effectiveScore = invert ? 100 - score : score
    if (effectiveScore >= 70) return "text-emerald-400"
    if (effectiveScore >= 50) return "text-blue-400"
    if (effectiveScore >= 30) return "text-yellow-400"
    return "text-orange-400"
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn("w-3.5 h-3.5", getColor(value))} />
      </div>
      <p className={cn("text-xl font-bold", getColor(value))}>{value}</p>
    </div>
  )
}

function RiskIndicator({
  label,
  value,
  icon: Icon,
  invert = false,
}: {
  label: string
  value: number
  icon: any
  invert?: boolean
}) {
  const getColor = (score: number) => {
    const effectiveScore = invert ? 100 - score : score
    if (effectiveScore >= 70) return { text: "text-red-400", bg: "from-red-500 to-rose-500" }
    if (effectiveScore >= 50) return { text: "text-orange-400", bg: "from-orange-500 to-amber-500" }
    if (effectiveScore >= 30) return { text: "text-yellow-400", bg: "from-yellow-500 to-amber-500" }
    return { text: "text-emerald-400", bg: "from-emerald-500 to-green-500" }
  }

  const color = getColor(value)

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn("w-3.5 h-3.5", color.text)} />
      </div>
      <div className="space-y-1">
        <p className={cn("text-lg font-bold", color.text)}>{value}%</p>
        <Progress
          value={value}
          className="h-1.5"
          indicatorClassName={cn("bg-gradient-to-r", color.bg)}
        />
      </div>
    </div>
  )
}

function DetailedMetric({ label, value }: { label: string; value: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return { text: "text-emerald-400", bg: "from-emerald-500 to-green-500" }
    if (score >= 60) return { text: "text-blue-400", bg: "from-blue-500 to-cyan-500" }
    if (score >= 40) return { text: "text-yellow-400", bg: "from-yellow-500 to-amber-500" }
    if (score >= 20) return { text: "text-orange-400", bg: "from-orange-500 to-red-500" }
    return { text: "text-red-400", bg: "from-red-600 to-rose-600" }
  }

  const color = getColor(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold", color.text)}>{value}/100</span>
      </div>
      <Progress
        value={value}
        className="h-2"
        indicatorClassName={cn("bg-gradient-to-r", color.bg)}
      />
    </div>
  )
}
