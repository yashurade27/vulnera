"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Loader2,
  MessageSquare,
  Shield,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { buildProcessPaymentInstruction } from "@/lib/blockchain/process-payment"
import { EnhancedAIInsights } from "@/components/enhanced-ai-insights"

interface SubmissionReviewPageProps {
  submissionId: string
}

type SubmissionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DUPLICATE"
  | "SPAM"
  | "NEEDS_MORE_INFO"

interface SubmissionReporter {
  id: string
  username: string | null
  fullName?: string | null
  reputation?: number | null
  totalEarnings?: number | null
  walletAddress?: string | null
}

interface SubmissionCompany {
  id: string
  name: string
  walletAddress?: string | null
}

interface SubmissionBounty {
  id: string
  title: string
  description?: string | null
  rewardAmount: string | number
  status?: string
  responseDeadline?: number
  maxSubmissions?: number | null
  escrowAddress?: string | null
  company?: SubmissionCompany
}

interface SubmissionComment {
  id: string
  content: string
  createdAt: string
  isInternal: boolean
  user: {
    id: string
    username: string | null
    fullName: string | null
    role?: string | null
  }
}

interface SubmissionPayment {
  id: string
  amount: string | number
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED"
  txSignature?: string | null
  completedAt?: string | null
  netAmount?: string | number | null
  platformFee?: string | number | null
}

interface SubmissionRecord {
  id: string
  bountyId: string
  title: string
  description: string
  bountyType: string
  vulnerabilityType: string
  stepsToReproduce: string
  impact: string
  proofOfConcept?: string | null
  attachments: string[]
  status: SubmissionStatus
  reviewNotes?: string | null
  rejectionReason?: string | null
  rewardAmount?: string | number | null
  responseDeadline: string
  submittedAt: string
  reviewedAt?: string | null
  aiSpamScore?: number | null
  aiDuplicateScore?: number | null
  aiAnalysisResult?: Record<string, unknown> | null
  bounty: SubmissionBounty
  user: SubmissionReporter
  company?: SubmissionCompany
  comments?: SubmissionComment[]
  payment?: SubmissionPayment | null
}

interface ReleasePaymentInfo {
  paymentParams: {
    bountyId: string
    submissionId: string
    escrowAddress: string
    ownerWallet: string
    hunterWallet: string
    platformWallet: string
    rewardPerSubmission: number
    maxSubmissions: number
    currentPaidSubmissions: number
    customAmount: number | null
    programId: string
  }
  amounts: {
    totalAmount: number
    hunterAmount: number
    platformFee: number
  }
  message: string
}

type RiskCategory = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/40",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/40",
  DUPLICATE: "bg-purple-500/10 text-purple-400 border-purple-500/40",
  SPAM: "bg-orange-500/10 text-orange-400 border-orange-500/40",
  NEEDS_MORE_INFO: "bg-sky-500/10 text-sky-400 border-sky-500/40",
}

const RISK_OPTIONS: Array<{
  value: RiskCategory
  label: string
  helper: string
  selectedClass: string
}> = [
  {
    value: "LOW",
    label: "Low Risk",
    helper: "Minimal impact, contained scope",
    selectedClass:
      "border-transparent bg-gradient-to-r from-emerald-400 to-emerald-500 text-gray-900 shadow-md",
  },
  {
    value: "MEDIUM",
    label: "Moderate Risk",
    helper: "Requires attention, limited blast radius",
    selectedClass:
      "border-transparent bg-gradient-to-r from-sky-400 to-sky-500 text-gray-900 shadow-md",
  },
  {
    value: "HIGH",
    label: "High Risk",
    helper: "Significant impact with realistic exploit path",
    selectedClass:
      "border-transparent bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 shadow-md",
  },
  {
    value: "CRITICAL",
    label: "Critical Risk",
    helper: "Immediate action needed, broad compromise potential",
    selectedClass:
      "border-transparent bg-gradient-to-r from-rose-500 to-rose-600 text-gray-900 shadow-md",
  },
]

function formatDate(value?: string | null): string {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch (error) {
    console.error("Unable to format date", error)
    return value
  }
}

function formatLamports(lamports: number): string {
  const sol = lamports / 1_000_000_000
  return `${sol.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`
}

function formatSol(value?: string | number | null): string {
  if (value === null || value === undefined) return "—"
  const numeric = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(numeric)) return "—"
  return `${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL`
}

const SEVERITY_LABELS = [
  { threshold: 80, label: "Critical" },
  { threshold: 60, label: "High" },
  { threshold: 40, label: "Medium" },
  { threshold: 0, label: "Low" },
]

function resolveSeverityLabel(score: number): string {
  const match = SEVERITY_LABELS.find((item) => score >= item.threshold)
  return match?.label ?? "Low"
}

export function SubmissionReviewPage({ submissionId }: SubmissionReviewPageProps) {
  const router = useRouter()
  const { publicKey, signTransaction, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [submission, setSubmission] = useState<SubmissionRecord | null>(null)
  const [comments, setComments] = useState<SubmissionComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [selectedRisk, setSelectedRisk] = useState<RiskCategory>("MEDIUM")
  const [severityValue, setSeverityValue] = useState<number[]>([55])
  const [manualSeverity, setManualSeverity] = useState("")
  const [decisionNotes, setDecisionNotes] = useState("")

  const [rejectionReason, setRejectionReason] = useState("")
  const [infoRequestMessage, setInfoRequestMessage] = useState("")

  const [commentContent, setCommentContent] = useState("")
  const [commentInternal, setCommentInternal] = useState(true)
  const [isPostingComment, setIsPostingComment] = useState(false)

  const [releaseInfo, setReleaseInfo] = useState<ReleasePaymentInfo | null>(null)
  const [txSignature, setTxSignature] = useState("")
  const [isPreparingPayment, setIsPreparingPayment] = useState(false)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false)

  const severityScore = severityValue[0] ?? 0
  const severityLabel = useMemo(() => resolveSeverityLabel(severityScore), [severityScore])

  const fetchSubmission = useCallback(
    async (silent = false) => {
      if (!submissionId) return
      if (!silent) {
        setIsLoading(true)
        setLoadError(null)
      } else {
        setIsRefreshing(true)
      }
      try {
        const response = await fetch(`/api/submissions/${submissionId}`, {
          credentials: "include",
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load submission")
        }
        const record: SubmissionRecord | undefined = payload?.submission
        if (!record) {
          throw new Error("Submission details missing in response")
        }
        setSubmission(record)
        setComments(record.comments ?? [])

        setDecisionNotes(record.reviewNotes ?? "")
        setRejectionReason(record.rejectionReason ?? "")

        const analysis = (record.aiAnalysisResult ?? null) as
          | { severityScore?: unknown; score?: unknown; riskCategory?: unknown }
          | null
        const severityCandidate =
          (analysis?.severityScore as number | string | undefined) ??
          (analysis?.score as number | string | undefined)
        const parsedSeverity =
          typeof severityCandidate === "number"
            ? severityCandidate
            : typeof severityCandidate === "string"
            ? parseFloat(severityCandidate)
            : undefined
        if (typeof parsedSeverity === "number" && !Number.isNaN(parsedSeverity)) {
          setSeverityValue([Math.min(100, Math.max(0, Math.round(parsedSeverity)))])
        }

        const riskCandidate =
          typeof analysis?.riskCategory === "string"
            ? (analysis.riskCategory as string)
            : undefined
        if (riskCandidate) {
          const normalized = riskCandidate.toUpperCase() as RiskCategory
          if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(normalized)) {
            setSelectedRisk(normalized)
          }
        }
      } catch (error) {
        console.error("Failed to fetch submission", error)
        setLoadError(error instanceof Error ? error.message : "Unable to load submission")
      } finally {
        if (!silent) {
          setIsLoading(false)
        }
        setIsRefreshing(false)
      }
    },
    [submissionId]
  )

  useEffect(() => {
    void fetchSubmission()
  }, [fetchSubmission])

  const compileReviewNotes = () => {
    const parts = [
      `Risk Category: ${selectedRisk}`,
      `Severity Score: ${severityScore} (${severityLabel})`,
    ]
    if (manualSeverity.trim()) {
      parts.push(`Manual Severity: ${manualSeverity.trim()}`)
    }
    if (decisionNotes.trim()) {
      parts.push(decisionNotes.trim())
    }
    return parts.join("\n")
  }

  const handleSubmitReview = async (status: SubmissionStatus) => {
    if (!submission) return

    if (status === "APPROVED") {
      // Use the fixed reward amount from the bounty
      const bountyReward = submission.rewardAmount ?? submission.bounty?.rewardAmount
      const numericReward = typeof bountyReward === "string" ? parseFloat(bountyReward) : bountyReward
      
      if (!numericReward || Number.isNaN(numericReward) || numericReward <= 0) {
        toast.error("Invalid reward amount for this bounty")
        return
      }

      // Check if wallet is connected
      if (!publicKey) {
        toast.error("Please connect your wallet to process the payment")
        return
      }

      // Check if hunter has wallet address
      if (!submission.user.walletAddress) {
        toast.error("Hunter has not set up their wallet address yet")
        return
      }
    }

    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Provide a rejection reason to continue")
      return
    }

    if (status === "NEEDS_MORE_INFO" && !infoRequestMessage.trim()) {
      toast.error("Explain what additional information is required")
      return
    }

    try {
      setIsSubmittingDecision(true)
      
      // For non-approval actions, submit review immediately
      if (status !== "APPROVED") {
        const payload: Record<string, unknown> = {
          status,
          reviewNotes: compileReviewNotes(),
        }
        if (status === "REJECTED") {
          payload.rejectionReason = rejectionReason.trim()
        }
        if (status === "NEEDS_MORE_INFO") {
          payload.reviewNotes = infoRequestMessage.trim()
        }

        const response = await fetch(`/api/submissions/${submissionId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })

        const body = await response.json()
        if (!response.ok) {
          throw new Error(body?.error ?? "Review action failed")
        }

        toast.success(`Submission ${status.replaceAll("_", " ").toLowerCase()}`)
        
        if (status === "REJECTED") {
          setRejectionReason("")
        }
        if (status === "NEEDS_MORE_INFO") {
          setInfoRequestMessage("")
        }
        await fetchSubmission(true)
        return
      }

      // For APPROVED status: Process payment FIRST, then approve submission
      if (status === "APPROVED") {
        toast.info("Preparing blockchain transaction...")
        
        try {
          // Get payment parameters directly from submission data (no API call needed)
          if (!submission.bounty.escrowAddress) {
            throw new Error("Bounty escrow not initialized")
          }

          if (!submission.bounty.company?.walletAddress) {
            throw new Error("Company wallet address not set")
          }

          const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || 'GbLLTkUjCznwRrkLM6tewimmW6ZCC4AP8eF9yAD8e5qT'
          
          // Get current paid submissions count
          const paidSubmissionsResponse = await fetch(`/api/bounties/${submission.bountyId}/stats`)
          const statsData = await paidSubmissionsResponse.json()
          const currentPaidSubmissions = statsData?.paidSubmissions || 0

          // Build the smart contract instruction
          const instruction = buildProcessPaymentInstruction({
            owner: new PublicKey(submission.bounty.company.walletAddress),
            hunterWallet: new PublicKey(submission.user.walletAddress!),
            platformWallet: new PublicKey(platformWallet),
            bountyId: submission.bountyId,
            submissionId: submission.id,
            customAmount: null,
            rewardPerSubmission: Number(submission.bounty.rewardAmount) * 1_000_000_000,
            maxSubmissions: submission.bounty.maxSubmissions || 999999,
            currentPaidSubmissions,
          })

          // Create transaction
          const transaction = new Transaction().add(instruction)
          
          // Get recent blockhash
          const { blockhash } = await connection.getLatestBlockhash()
          
          transaction.recentBlockhash = blockhash
          transaction.feePayer = publicKey!

          // Send transaction using wallet adapter
          const signature = await sendTransaction(transaction, connection)
          toast.success("Transaction sent! Waiting for confirmation...")

          // Now approve the submission with the transaction signature
          const bountyReward = submission.rewardAmount ?? submission.bounty?.rewardAmount
          const numericReward = typeof bountyReward === "string" ? parseFloat(bountyReward) : bountyReward
          
          const approvePayload = {
            status: "APPROVED",
            reviewNotes: compileReviewNotes(),
            rewardAmount: numericReward?.toString(),
          }

          const approveResponse = await fetch(`/api/submissions/${submissionId}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(approvePayload),
          })

          const approveBody = await approveResponse.json()
          if (!approveResponse.ok) {
            throw new Error(approveBody?.error ?? "Failed to approve submission after payment")
          }

          // Confirm the payment in backend (it will verify on-chain)
          const confirmResponse = await fetch("/api/payments/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              submissionId,
              txSignature: signature,
            }),
          })

          if (!confirmResponse.ok) {
            console.error("Payment confirmed on-chain but failed to update database")
            // Still show success since blockchain tx succeeded and submission was approved
          }

          toast.success("Payment processed and submission approved!")
          await fetchSubmission(true)
          
        } catch (paymentError) {
          console.error("Payment error:", paymentError)
          if (paymentError instanceof Error && paymentError.message.includes('User rejected')) {
            toast.error("Transaction cancelled by user. Submission remains pending.")
          } else {
            toast.error("Payment failed. Submission remains pending. Please try again.")
          }
          // Don't approve the submission if payment failed
          throw paymentError
        }
      }
    } catch (error) {
      console.error("Review action failed", error)
      toast.error(error instanceof Error ? error.message : "Unable to process review")
    } finally {
      setIsSubmittingDecision(false)
    }
  }

  const handlePreparePayment = async () => {
    if (!submission) return
    if (submission.status !== "APPROVED") {
      toast.error("Approve the submission before preparing payment")
      return
    }
    try {
      setIsPreparingPayment(true)
      const response = await fetch("/api/blockchain/release-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ submissionId }),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error ?? "Unable to prepare payment")
      }
      setReleaseInfo(body)
      toast.success("Payment parameters ready. Continue in your wallet")
    } catch (error) {
      console.error("Prepare payment failed", error)
      toast.error(error instanceof Error ? error.message : "Could not prepare payment")
    } finally {
      setIsPreparingPayment(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!txSignature.trim()) {
      toast.error("Paste the transaction signature before confirming")
      return
    }
    try {
      setIsConfirmingPayment(true)
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ submissionId, txSignature: txSignature.trim() }),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error ?? "Unable to confirm payment")
      }
      toast.success("Payment confirmed on-chain")
      setReleaseInfo(null)
      setTxSignature("")
      await fetchSubmission(true)
    } catch (error) {
      console.error("Confirm payment failed", error)
      toast.error(error instanceof Error ? error.message : "Payment confirmation failed")
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      toast.error("Write a comment before sending")
      return
    }
    try {
      setIsPostingComment(true)
      const response = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: commentContent.trim(),
          isInternal: commentInternal,
        }),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error ?? "Unable to post comment")
      }
      const newComment: SubmissionComment | undefined = body?.comment
      if (newComment) {
        setComments((previous) => [...previous, newComment])
      }
      setCommentContent("")
      toast.success("Comment posted")
    } catch (error) {
      console.error("Comment creation failed", error)
      toast.error(error instanceof Error ? error.message : "Failed to create comment")
    } finally {
      setIsPostingComment(false)
    }
  }

  const pendingResponseDays = useMemo(() => {
    if (!submission) return null
    try {
      const submitted = new Date(submission.submittedAt).getTime()
      const deadline = new Date(submission.responseDeadline).getTime()
      const diff = deadline - submitted
      return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
    } catch (error) {
      console.error("Failed to compute response window", error)
      return null
    }
  }, [submission])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin" />
        <p className="text-muted-foreground">Loading submission…</p>
      </div>
    )
  }

  if (loadError || !submission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/40 bg-red-500/10">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-200">{loadError ?? "Submission not found"}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go back
        </Button>
      </div>
    )
  }

  const paymentCompleted = submission.payment?.status === "COMPLETED"

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur">
        <div className="container-custom py-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <Button variant="ghost" size="sm" className="px-2" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <span className="text-muted-foreground/60">/</span>
            <Link href="/dashboard/company" className="hover:text-foreground transition">
              Company Dashboard
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-foreground">Submission Review</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{submission.title}</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {submission.bounty?.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={cn("border", STATUS_STYLES[submission.status])}>
                {submission.status.replaceAll("_", " ")}
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {submission.vulnerabilityType}
              </Badge>
              <Badge variant="outline" className="bg-white/5 text-white border-white/10">
                {submission.bountyType}
              </Badge>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card/60 px-4 py-3 space-y-1">
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Submitted</p>
              <p className="text-sm font-medium">{formatDate(submission.submittedAt)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 px-4 py-3 space-y-1">
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Response Window</p>
              <p className="text-sm font-medium">
                {pendingResponseDays !== null ? `${pendingResponseDays} days` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 px-4 py-3 space-y-1">
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Reward Pool</p>
              <p className="text-sm font-medium">{formatSol(submission.bounty?.rewardAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {isRefreshing ? (
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Syncing latest review state…
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card className="card-glass">
              <CardHeader className="flex flex-col gap-2 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Reporter</CardTitle>
                  <Badge variant="outline" className="bg-sky-500/10 text-sky-300 border-sky-500/30">
                    Hunter
                  </Badge>
                </div>
                <CardDescription className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{submission.user.fullName ?? submission.user.username}</span>
                  {submission.user.username ? (
                    <span className="text-muted-foreground/70">@{submission.user.username}</span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border border-border bg-card/40">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Reputation</p>
                  <p className="text-lg font-semibold">
                    {submission.user.reputation ?? "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card/40">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Lifetime Earnings</p>
                  <p className="text-lg font-semibold">{formatSol(submission.user.totalEarnings)}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card/40">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Wallet</p>
                  <p className="text-xs font-mono break-all leading-relaxed">
                    {submission.user.walletAddress ?? "Wallet pending"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Vulnerability Details</CardTitle>
                <CardDescription>
                  Complete context provided by the hunter. Review carefully before making a decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-yellow-300" />
                    Summary
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {submission.description}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ListIcon />
                    Steps to Reproduce
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                    {submission.stepsToReproduce}
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-300" />
                    Impact Assessment
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                    {submission.impact}
                  </p>
                </section>

                {submission.proofOfConcept ? (
                  <section>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-300" />
                      Proof of Concept
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                      {submission.proofOfConcept}
                    </p>
                  </section>
                ) : null}

                {submission.attachments?.length ? (
                  <section>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-300" />
                      Attachments
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {submission.attachments.map((attachment) => (
                        <Link
                          key={attachment}
                          href={attachment}
                          target="_blank"
                          rel="noopener"
                          className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-sky-400/50 hover:text-sky-200"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-sky-200" />
                          <span className="truncate max-w-[180px] text-xs font-medium">
                            {attachment.replace(/^https?:\/\//, "")}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </CardContent>
            </Card>

            {/* <Card className="card-glass">
              <CardHeader className="border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-300" /> AI Insights
                    </CardTitle>
                    <CardDescription>
                      Automated heuristics to help triage, not a substitute for manual validation.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        setIsRefreshing(true)
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

                        setSubmission((prev) => {
                          if (!prev) return prev
                          return {
                            ...prev,
                            aiAnalysisResult: data.analysis as any,
                            aiSpamScore: data.analysis.spamProbability / 100,
                            aiDuplicateScore: data.analysis.duplicateLikelihood / 100,
                          }
                        })

                        // Auto-populate severity and risk from AI
                        const severityScore = data.analysis.overallScore
                        setSeverityValue([severityScore])

                        const riskMap: Record<string, RiskCategory> = {
                          LOW: "LOW",
                          MEDIUM: "MEDIUM",
                          HIGH: "HIGH",
                          CRITICAL: "CRITICAL",
                        }
                        setSelectedRisk(riskMap[data.analysis.severityLevel])

                        toast.success("AI analysis completed successfully")
                      } catch (error) {
                        console.error("Analysis error:", error)
                        toast.error(error instanceof Error ? error.message : "Failed to analyze submission")
                      } finally {
                        setIsRefreshing(false)
                      }
                    }}
                    disabled={isRefreshing}
                    size="sm"
                    variant="outline"
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <InsightGauge
                    label="Spam Probability"
                    value={submission.aiSpamScore ?? 0}
                    accent="from-emerald-400 to-emerald-500"
                  />
                  <InsightGauge
                    label="Duplicate Likelihood"
                    value={submission.aiDuplicateScore ?? 0}
                    accent="from-sky-400 to-sky-500"
                  />
                </div>
              </CardContent>
            </Card> */}

            <EnhancedAIInsights
              submissionId={submissionId}
              existingAnalysis={submission.aiAnalysisResult as any}
              onAnalysisComplete={(analysis) => {
                // Update local state with new analysis
                setSubmission((prev) => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    aiAnalysisResult: analysis as any,
                    aiSpamScore: analysis.spamProbability / 100,
                    aiDuplicateScore: analysis.duplicateLikelihood / 100,
                  }
                })

                // Auto-populate severity and risk from AI
                const severityScore = analysis.overallScore
                setSeverityValue([severityScore])

                const riskMap: Record<string, RiskCategory> = {
                  LOW: "LOW",
                  MEDIUM: "MEDIUM",
                  HIGH: "HIGH",
                  CRITICAL: "CRITICAL",
                }
                setSelectedRisk(riskMap[analysis.severityLevel])
              }}
            />

            <Card className="card-glass">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Discussion
                </CardTitle>
                <CardDescription className="text-sm">
                  Align with the hunter or loop in internal stakeholders before finalizing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "rounded-lg border px-4 py-3 bg-card/40",
                          comment.isInternal
                            ? "border-purple-500/30 bg-purple-500/5"
                            : "border-border/60"
                        )}
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span className="font-medium text-foreground/90">
                            {comment.user.fullName ?? comment.user.username ?? "Reviewer"}
                          </span>
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm whitespace-pre-line text-foreground/90">{comment.content}</p>
                        {comment.isInternal ? (
                          <p className="mt-2 text-xs font-semibold text-purple-200">Internal only</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="comment" className="text-sm">Add Comment</Label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        id="internal"
                        checked={commentInternal}
                        onCheckedChange={setCommentInternal}
                      />
                      Internal note
                    </div>
                  </div>
                  <Textarea
                    id="comment"
                    placeholder="Share findings, mitigation steps, or clarifying questions"
                    value={commentContent}
                    onChange={(event) => setCommentContent(event.target.value)}
                    className="min-h-24"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddComment} disabled={isPostingComment}>
                      {isPostingComment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting…
                        </>
                      ) : (
                        "Post Comment"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative border-l border-border/60 ml-4 space-y-6">
                  <li>
                    <div className="absolute -left-[9px] top-1 w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="pl-6">
                      <p className="text-sm font-semibold">Submission created</p>
                      <p className="text-xs text-muted-foreground">{formatDate(submission.submittedAt)}</p>
                    </div>
                  </li>
                  {submission.reviewedAt ? (
                    <li>
                      <div className="absolute -left-[9px] top-1 w-3 h-3 rounded-full bg-sky-400" />
                      <div className="pl-6">
                        <p className="text-sm font-semibold">Reviewed</p>
                        <p className="text-xs text-muted-foreground">{formatDate(submission.reviewedAt)}</p>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                          {submission.reviewNotes ?? "No review notes recorded."}
                        </p>
                      </div>
                    </li>
                  ) : null}
                  {submission.payment?.txSignature ? (
                    <li>
                      <div className="absolute -left-[9px] top-1 w-3 h-3 rounded-full bg-emerald-400" />
                      <div className="pl-6">
                        <p className="text-sm font-semibold">Payment confirmed</p>
                        <p className="text-xs text-muted-foreground">{formatDate(submission.payment.completedAt)}</p>
                        <Link
                          href={`https://explorer.solana.com/tx/${submission.payment.txSignature}?cluster=${process.env.NEXT_PUBLIC_CLUSTER}`}
                          target="_blank"
                          rel="noopener"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300"
                        >
                          View on Explorer
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </li>
                  ) : null}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-glass">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Risk & Severity
                </CardTitle>
                <CardDescription>
                  Contextualize the issue before acting. These notes will accompany the decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Risk Category</Label>
                  <div className="mt-3 grid gap-3">
                    {RISK_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedRisk(option.value)}
                        className={cn(
                          "text-left rounded-xl border px-4 py-3 transition",
                          selectedRisk === option.value
                            ? option.selectedClass
                            : "border-border/60 bg-card/40 text-foreground/80 hover:border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">
                            {option.label}
                          </p>
                          {selectedRisk === option.value ? (
                            <BadgeCheck className="w-4 h-4" />
                          ) : null}
                        </div>
                        <p className="text-xs mt-1 text-foreground/70">
                          {option.helper}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <Label htmlFor="severity">Severity Score</Label>
                    <span className="text-xs text-muted-foreground">
                      {severityScore}/100 • {severityLabel}
                    </span>
                  </div>
                  <Slider
                    id="severity"
                    value={severityValue}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={setSeverityValue}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manualSeverity">Manual Severity Override</Label>
                  <Input
                    id="manualSeverity"
                    placeholder="e.g., Aligns with CVSS 8.6 due to privilege escalation"
                    value={manualSeverity}
                    onChange={(event) => setManualSeverity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decisionNotes">Decision Notes</Label>
                  <Textarea
                    id="decisionNotes"
                    value={decisionNotes}
                    onChange={(event) => setDecisionNotes(event.target.value)}
                    placeholder="Summarize validation steps, mitigations, or policy references"
                    className="min-h-24"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>
                  Approve to proceed with payout, reject with justification, or pause pending more detail.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="approve" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="approve">Approve</TabsTrigger>
                    <TabsTrigger value="reject">Reject</TabsTrigger>
                    <TabsTrigger value="needs-info">Request Info</TabsTrigger>
                  </TabsList>
                  <TabsContent value="approve" className="space-y-4">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Reward Amount</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Fixed reward per submission for this bounty
                          </p>
                        </div>
                        <p className="text-xl font-bold text-yellow-400">
                          {formatSol(submission.rewardAmount ?? submission.bounty?.rewardAmount)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSubmitReview("APPROVED")}
                      disabled={isSubmittingDecision || submission.status === "APPROVED" || submission.status === "REJECTED"}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                    >
                      {isSubmittingDecision ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Submission
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  <TabsContent value="reject" className="space-y-4">
                    <div>
                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        placeholder="Explain why the submission does not qualify. This is shared with the hunter."
                        className="mt-2 min-h-32"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleSubmitReview("REJECTED")}
                      disabled={isSubmittingDecision || submission.status === "REJECTED" || submission.status === "APPROVED"}
                      className="w-full border-red-500/50 text-red-200 hover:bg-red-500/10"
                    >
                      {isSubmittingDecision ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4 mr-2" /> Reject Submission
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  <TabsContent value="needs-info" className="space-y-4">
                    <div>
                      <Label htmlFor="infoRequest">Information Request</Label>
                      <Textarea
                        id="infoRequest"
                        value={infoRequestMessage}
                        onChange={(event) => setInfoRequestMessage(event.target.value)}
                        placeholder="Clarify missing repro steps, environment details, or logs to continue review."
                        className="mt-2 min-h-32"
                        disabled={submission.status === "APPROVED"}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleSubmitReview("NEEDS_MORE_INFO")}
                      disabled={isSubmittingDecision || submission.status === "NEEDS_MORE_INFO" || submission.status === "APPROVED"}
                      className="w-full"
                    >
                      {isSubmittingDecision ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" /> Request More Information
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader className="border-b border-border/60">
                <CardTitle>Program Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bounty Status</span>
                  <span className="font-medium">{submission.bounty?.status ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{submission.bounty?.company?.name ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Response Deadline</span>
                  <span className="font-medium">{formatDate(submission.responseDeadline)}</span>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/60">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/bounties/${submission.bounty?.id}`}>View bounty details</Link>
                </Button>
              </CardFooter>
            </Card>

            {!paymentCompleted ? (
              <Card className="card-glass border-yellow-500/40 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-200">
                    <AlertCircle className="w-4 h-4" /> Pending Payment
                  </CardTitle>
                  <CardDescription className="text-yellow-100/80">
                    Approve the submission, trigger the escrow release, then confirm the signature here to finalize.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function InsightGauge({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value ?? 0) * 100)))
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <div
          className={cn("h-full bg-gradient-to-r", accent)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{percentage}% confidence</p>
    </div>
  )
}

function ListIcon() {
  return (
    <svg
      className="w-4 h-4 text-muted-foreground"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 4H13M5 8H13M5 12H13M3 4H3.01M3 8H3.01M3 12H3.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
