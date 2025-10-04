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
  Info,
  XCircle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// --- Enums and Interfaces ---
enum SubmissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  NEEDS_MORE_INFO = "NEEDS_MORE_INFO",
}

enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

interface SubmissionReviewPageProps {
  submissionId: string
}

interface User {
  name: string | null
  walletAddress: string | null
}

interface Company {
  name: string
}

interface Bounty {
  id: string
  title: string
  company: Company
}

interface Payment {
  status: PaymentStatus
  txSignature: string | null
  amount: number
  createdAt: string
}

interface Submission {
  id: string
  status: SubmissionStatus
  vulnerabilityType: string
  proofOfConcept: string | null
  submittedAt: string
  updatedAt: string
  reviewNotes: string | null
  bounty: Bounty
  user: User
  payment: Payment | null
}

// --- Helper Components ---
const InfoItem = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-muted-foreground">{label}</span>
    {value ? <span className="text-sm font-medium">{value}</span> : children}
  </div>
);

const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
  const statusStyles = {
    [SubmissionStatus.PENDING]: "bg-yellow-500/10 text-yellow-300 border-yellow-500/40",
    [SubmissionStatus.APPROVED]: "bg-green-500/10 text-green-300 border-green-500/40",
    [SubmissionStatus.REJECTED]: "bg-red-500/10 text-red-300 border-red-500/40",
    [SubmissionStatus.NEEDS_MORE_INFO]: "bg-blue-500/10 text-blue-300 border-blue-500/40",
  };
  return <Badge variant="outline" className={cn("capitalize", statusStyles[status])}>{status.replace(/_/g, ' ')}</Badge>;
};

// --- Main Component ---
export function SubmissionReviewPage({ submissionId }: SubmissionReviewPageProps) {
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false)

  // Review state
  const [rewardAmount, setRewardAmount] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [feedbackForHunter, setFeedbackForHunter] = useState("")

  const fetchSubmission = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // In a real app, you'd fetch from your API
      // const response = await fetch(`/api/submissions/${submissionId}`);
      // const data = await response.json();
      // setSubmission(data);

      // Mock data for demonstration
      const mockSubmission: Submission = {
        id: submissionId,
        status: SubmissionStatus.PENDING,
        vulnerabilityType: "Cross-Site Scripting (XSS)",
        proofOfConcept: "Injecting `<script>alert('XSS')</script>` into the search bar...",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        reviewNotes: null,
        bounty: { id: "bounty-123", title: "XSS in Search Bar", company: { name: "SecureApp Inc." } },
        user: { name: "Alex Ray", walletAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGK" },
        payment: null,
      };
      setSubmission(mockSubmission);

    } catch (e) {
      setError("Failed to fetch submission details.")
      toast.error("Failed to fetch submission details.")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    fetchSubmission()
  }, [fetchSubmission])

  const compileReviewNotes = () => {
    return JSON.stringify({
      internalNotes,
      feedbackForHunter,
    });
  };

  const handleApproveAndPay = async () => {
    if (!submission) return;

    const numericReward = parseFloat(rewardAmount);
    if (!rewardAmount || Number.isNaN(numericReward) || numericReward <= 0) {
      toast.error("Enter a valid reward amount before approving.");
      return;
    }

    setIsSubmittingDecision(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const body = { txSignature: "mock_tx_" + Math.random().toString(36).substr(2, 9) };

      toast.success("Submission approved and payment sent!", {
        description: `Tx: ${body.txSignature}`,
      });
      await fetchSubmission(true); // Refresh data silently
    } catch (error) {
      console.error("Approval and payment failed", error);
      toast.error(error instanceof Error ? error.message : "Could not process approval and payment.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleSubmitReview = async (status: SubmissionStatus.REJECTED | SubmissionStatus.NEEDS_MORE_INFO) => {
    if (!submission) return;
    // TODO: Implement API endpoints for rejecting or requesting more info
    toast.info(`Action "${status.replace(/_/g, ' ')}" is not implemented yet.`);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  if (error || !submission) {
    return <div className="text-center text-red-400">{error || "Submission not found."}</div>
  }

  const isDecisionMade = submission.status === SubmissionStatus.APPROVED || submission.status === SubmissionStatus.REJECTED;

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Submissions
        </Button>

        <header className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Review Submission</h1>
            <p className="text-muted-foreground">For bounty: {submission.bounty.title}</p>
          </div>
          <div className="mt-2 md:mt-0">
            <StatusBadge status={submission.status} />
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Vulnerability Type</h3>
                  <p className="text-muted-foreground">{submission.vulnerabilityType}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Proof of Concept</h3>
                  <pre className="bg-gray-900/50 p-4 rounded-md text-sm whitespace-pre-wrap font-mono">
                    {submission.proofOfConcept}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {submission.payment && (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" /> Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoItem label="Status">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/40 capitalize">
                      {submission.payment.status.toLowerCase()}
                    </Badge>
                  </InfoItem>
                  <InfoItem label="Amount" value={`${submission.payment.amount} SOL`} />
                  <InfoItem label="Transaction">
                    {submission.payment.txSignature ? (
                      <Link
                        href={`https://solscan.io/tx/${submission.payment.txSignature}?cluster=devnet`}
                        target="_blank"
                        className="flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        View on Solscan <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-sm">N/A</span>
                    )}
                  </InfoItem>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Review & Action</CardTitle>
                <CardDescription>Approve, reject, or request more info.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-amount">Reward Amount (SOL)</Label>
                  <Input
                    id="reward-amount"
                    type="number"
                    placeholder="e.g., 100"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    disabled={isDecisionMade}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Internal Notes</Label>
                  <Textarea
                    placeholder="Notes visible only to your team..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    disabled={isDecisionMade}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feedback for Hunter</Label>
                  <Textarea
                    placeholder="This will be shared with the hunter..."
                    value={feedbackForHunter}
                    onChange={(e) => setFeedbackForHunter(e.target.value)}
                    disabled={isDecisionMade}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  onClick={handleApproveAndPay}
                  disabled={isSubmittingDecision || isDecisionMade}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500"
                >
                  {isSubmittingDecision ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving & Paying...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Pay</>
                  )}
                </Button>
                <div className="flex w-full gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubmitReview(SubmissionStatus.NEEDS_MORE_INFO)}
                    disabled={isSubmittingDecision || isDecisionMade}
                  >
                    <Info className="w-4 h-4 mr-2" /> Needs Info
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleSubmitReview(SubmissionStatus.REJECTED)}
                    disabled={isSubmittingDecision || isDecisionMade}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Hunter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoItem label="Name" value={submission.user.name ?? "Anonymous"} />
                <InfoItem label="Wallet Address">
                  <Tooltip>
                    <TooltipTrigger>
                      <Link
                        href={submission.user.walletAddress ? `https://solscan.io/account/${submission.user.walletAddress}?cluster=devnet` : '#'}
                        target="_blank"
                        className={cn("font-mono text-xs", submission.user.walletAddress ? "text-cyan-400 hover:underline" : "text-muted-foreground cursor-not-allowed")}
                      >
                        {submission.user.walletAddress ? `${submission.user.walletAddress.slice(0, 6)}...${submission.user.walletAddress.slice(-6)}` : 'Not Available'}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{submission.user.walletAddress ?? 'No wallet address provided'}</TooltipContent>
                  </Tooltip>
                </InfoItem>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
