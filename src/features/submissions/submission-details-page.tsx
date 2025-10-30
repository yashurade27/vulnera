"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  MessageSquare,
  Paperclip,
  Target,
  AlertTriangle,
  Shield,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 border-yellow-400/40 text-yellow-200",
  APPROVED: "bg-green-500/10 border-green-400/40 text-green-200",
  REJECTED: "bg-red-500/10 border-red-400/40 text-red-200",
  NEEDS_MORE_INFO: "bg-blue-500/10 border-blue-400/40 text-blue-200",
  DUPLICATE: "bg-gray-500/10 border-gray-400/40 text-gray-200",
  SPAM: "bg-orange-500/10 border-orange-400/40 text-orange-200",
}

interface Submission {
  id: string
  title: string
  description: string
  status: string
  bountyType: string
  vulnerabilityType: string
  stepsToReproduce: string
  impact: string
  proofOfConcept?: string
  attachments: string[]
  submittedAt: string
  reviewedAt?: string
  reviewNotes?: string
  rejectionReason?: string
  rewardAmount?: number
  bounty?: {
    id: string
    title: string
    rewardAmount: number
    company?: {
      id: string
      name: string
      logoUrl?: string
    }
  } | null
  company?: {
    id: string
    name: string
  } | null
}

interface Comment {
  id: string
  content: string
  isInternal: boolean
  createdAt: string
  user: {
    fullName?: string
    username?: string
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

export function SubmissionDetailsPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = React.use(params)
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  const fetchSubmission = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/submissions")
          return
        }
        throw new Error("Failed to fetch submission")
      }

      const data = await response.json()
      setSubmission(data.submission || data)
    } catch (error) {
      console.error("Error fetching submission:", error)
    } finally {
      setLoading(false)
    }
  }, [submissionId, router])

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/comments`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }, [submissionId])

  const handleAddComment = async () => {
    if (!commentText.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
        credentials: "include",
      })

      if (response.ok) {
        setCommentText("")
        await fetchComments()
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  useEffect(() => {
    if (sessionStatus !== "loading") {
      fetchSubmission()
      fetchComments()
    }
  }, [sessionStatus, fetchSubmission, fetchComments])

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 text-center space-y-4">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Sign in to view this submission.</p>
              <Button asChild>
                <Link href="/auth/login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Submission not found</p>
              <Button asChild variant="outline">
                <Link href="/submissions">Back to Submissions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className=" border-b border-border bg-card/40 bg-neutral-100 dark:bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/submissions">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Submissions
              </Link>
            </Button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[submission.status] || ""}
                >
                  {submission.status.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 border-purple-400/40 text-purple-200">
                  {submission.bountyType}
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-semibold mb-2">
                {submission.title}
              </h1>
              <p className="text-muted-foreground">
                Submitted {dateFormatter.format(new Date(submission.submittedAt))}
              </p>
            </div>
            {submission.rewardAmount && (
              <div className="text-right">
                <p className="text-3xl font-bold text-yellow-400">
                  {submission.rewardAmount} SOL
                </p>
                <p className="text-xs text-muted-foreground">Reward Amount</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Bounty Info */}
            {submission.bounty && (
              <Card className="card-glass">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {submission.bounty.company?.logoUrl && (
                      <img
                        src={submission.bounty.company.logoUrl}
                        alt={submission.bounty.company.name || "Company"}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {submission.bounty.company?.name || submission.company?.name || "Company"}
                        </span>
                      </div>
                      <Link
                        href={`/bounties/${submission.bounty.id}`}
                        className="text-lg font-semibold hover:text-yellow-400 transition"
                      >
                        {submission.bounty.title}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        Max Reward: {currencyFormatter.format(submission.bounty.rewardAmount || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {submission.description}
                </p>
              </CardContent>
            </Card>

            {/* Steps to Reproduce */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Steps to Reproduce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {submission.stepsToReproduce}
                </p>
              </CardContent>
            </Card>

            {/* Impact */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {submission.impact}
                </p>
              </CardContent>
            </Card>

            {/* Proof of Concept */}
            {submission.proofOfConcept && (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Proof of Concept
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {submission.proofOfConcept}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {submission.attachments && submission.attachments.length > 0 && (
              <Card className="card-glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Attachments ({submission.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submission.attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-border rounded-lg hover:border-yellow-400/50 transition"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate">Attachment {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Feedback */}
            {(submission.reviewNotes || submission.rejectionReason) && (
              <Card className="card-glass border-yellow-400/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Company Feedback
                  </CardTitle>
                  {submission.reviewedAt && (
                    <p className="text-sm text-muted-foreground">
                      Reviewed {dateFormatter.format(new Date(submission.reviewedAt))}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {submission.rejectionReason && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-1 text-red-300">Rejection Reason:</p>
                      <p className="text-muted-foreground">{submission.rejectionReason}</p>
                    </div>
                  )}
                  {submission.reviewNotes && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Review Notes:</p>
                      <p className="text-muted-foreground">{submission.reviewNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            {comment.user.fullName || comment.user.username || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dateFormatter.format(new Date(comment.createdAt))}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Add Comment */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="btn-primary"
                  >
                    {submittingComment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Comment"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vulnerability Type</p>
                  <p className="font-semibold">{submission.vulnerabilityType}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline">{submission.bountyType}</Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant="outline" className={STATUS_COLORS[submission.status]}>
                    {submission.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {dateFormatter.format(new Date(submission.submittedAt))}
                    </span>
                  </div>
                </div>
                {submission.reviewedAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Reviewed</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {dateFormatter.format(new Date(submission.reviewedAt))}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.bounty && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href={`/bounties/${submission.bounty.id}`}>
                      <Target className="w-4 h-4 mr-2" />
                      View Bounty
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/submissions">
                    <FileText className="w-4 h-4 mr-2" />
                    All Submissions
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/hunter">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
