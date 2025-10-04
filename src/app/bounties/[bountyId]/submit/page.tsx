"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useBountiesStore } from "@/stores/bounties-store"
import { type RouteParams } from "@/lib/next"

const VULNERABILITY_TYPES_BY_CATEGORY: Record<string, readonly string[]> = {
  SECURITY: [
    "Cross-Site Scripting (XSS)",
    "SQL Injection",
    "Cross-Site Request Forgery (CSRF)",
    "Authentication Bypass",
    "Authorization Issues",
    "Information Disclosure",
    "Remote Code Execution",
    "Denial of Service",
    "Business Logic Error",
    "Other",
  ],
  UI: [
    "Layout / Responsive Issue",
    "Visual / Styling Regression",
    "Accessibility (a11y)",
    "Broken Interaction",
    "Cross-browser Inconsistency",
    "Localization / RTL Issue",
    "Typography or Iconography",
    "Color Contrast",
    "Component State Bug",
    "Other",
  ],
  PERFORMANCE: [
    "Slow Page Load",
    "High CPU Usage",
    "Memory Leak",
    "Slow Database Query",
    "Inefficient Algorithm",
    "Caching Misconfiguration",
    "Network Latency",
    "Resource Intensive Rendering",
    "Battery Drain",
    "Other",
  ],
  FUNCTIONALITY: [
    "Broken Workflow",
    "Incorrect Business Logic",
    "Validation Failure",
    "State Management Issue",
    "Integration Failure",
    "Data Integrity Problem",
    "Error Handling Gap",
    "Session Handling Issue",
    "Edge Case Failure",
    "Other",
  ],
  DEFAULT: [
    "Incorrect Behavior",
    "Data Handling Issue",
    "Configuration Error",
    "Dependencies / Versioning",
    "Third-party Integration",
    "Documentation Gap",
    "Monitoring / Alerting",
    "Infrastructure",
    "Unexpected Crash",
    "Other",
  ],
} as const

const IMPACT_LEVELS = [
  { value: "LOW", label: "Low", description: "Minimal impact on system" },
  { value: "MEDIUM", label: "Medium", description: "Moderate impact, limited scope" },
  { value: "HIGH", label: "High", description: "Significant impact, affects multiple users" },
  { value: "CRITICAL", label: "Critical", description: "Severe impact, system-wide vulnerability" },
]

const mapSubmissionSummary = (submission: any) => ({
  id: submission?.id,
  title: submission?.title ?? "Submission",
  status: submission?.status ?? "PENDING",
  createdAt: submission?.createdAt ?? submission?.submittedAt ?? new Date().toISOString(),
  reporter: {
    displayName: submission?.user?.fullName ?? submission?.user?.username ?? "You",
    username: submission?.user?.username ?? null,
  },
})

function SubmitBugReportPage({ params }: { params: Promise<{ bountyId: string }> }) {
  const { bountyId } = React.use(params)
  const router = useRouter()
  const { currentBounty, setCurrentBounty, addSubmission } = useBountiesStore()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [vulnerabilityType, setVulnerabilityType] = useState("")
  const [description, setDescription] = useState("")
  const [stepsToReproduce, setStepsToReproduce] = useState("")
  const [impact, setImpact] = useState("")
  const [proofOfConcept, setProofOfConcept] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])

  const vulnerabilityOptions = useMemo(() => {
    const typeKey = currentBounty?.bountyType?.toUpperCase() ?? "DEFAULT"
    const options = VULNERABILITY_TYPES_BY_CATEGORY[typeKey]
    return options ?? VULNERABILITY_TYPES_BY_CATEGORY.DEFAULT
  }, [currentBounty?.bountyType])

  const fetchBountyInfo = useCallback(async () => {
    setLoading(true)
    try {
      // const response = await fetch(`/api/bounties/${bountyId}`);
      // if (!response.ok) {
      //   if (response.status === 404) {
      //     setCurrentBounty(null);
      //     return;
      //   }
      //   throw new Error(`Failed to fetch bounty: ${response.status}`);
      // }

      // const data = await response.json();
      // if (!data?.bounty) {
      //   setCurrentBounty(null);
      //   return;
      // }
      const data = {
        bounty: {
          id: bountyId,
          title: "Harden the dashboard authentication flow",
          bountyType: "SECURITY",
          rewardAmount: 1000,
          company: {
            name: "Vulnera Inc.",
            logoUrl: "/vulnera-logo.svg",
          },
        },
      };

      setCurrentBounty(data.bounty)
    } catch (error) {
      console.error("Failed to fetch bounty info:", error)
      setCurrentBounty(null)
    } finally {
      setLoading(false)
    }
  }, [bountyId, setCurrentBounty])

  useEffect(() => {
    fetchBountyInfo()
  }, [fetchBountyInfo])

  useEffect(() => {
    setTitle("")
    setVulnerabilityType("")
    setDescription("")
    setStepsToReproduce("")
    setImpact("")
    setProofOfConcept("")
    setAttachments([])
    setFormError(null)
  }, [bountyId])

  useEffect(() => {
    if (vulnerabilityType && !vulnerabilityOptions.includes(vulnerabilityType)) {
      setVulnerabilityType("")
    }
  }, [vulnerabilityOptions, vulnerabilityType])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }

    setAttachments((prev) => [...prev, ...Array.from(files)])
    e.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!currentBounty) {
      setFormError("Unable to load bounty details. Please refresh and try again.");
      return;
    }

    if (
      !title.trim() ||
      !vulnerabilityType ||
      !description.trim() ||
      !stepsToReproduce.trim() ||
      !impact
    ) {
      setFormError("Please complete all required fields before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      // Simulate a successful submission
      const submissionPayload = {
        submission: {
          id: "sub_" + Math.random().toString(36).substr(2, 9),
          title: title.trim(),
          status: "PENDING",
          createdAt: new Date().toISOString(),
          user: {
            fullName: "Guest User",
            username: "guest",
          },
        },
      };

      addSubmission(mapSubmissionSummary(submissionPayload.submission));
      router.push(`/bounties/${bountyId}?submitted=true`);
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      setFormError(
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!currentBounty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Bounty not found</h2>
          <Button onClick={() => router.push("/bounties")}>Back to Bounties</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container-custom py-6">
          <Button variant="ghost" onClick={() => router.push(`/bounties/${bountyId}`)} className="mb-4 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bounty
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
              {currentBounty.company.logoUrl ? (
                <img
                  src={currentBounty.company.logoUrl || "/placeholder.svg"}
                  alt={currentBounty.company.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <FileText className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-medium">Submit Bug Report</h1>
              <p className="text-muted-foreground">{currentBounty.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
              {currentBounty.bountyType}
            </Badge>
            <span className="text-sm text-muted-foreground">Reward: ${currentBounty.rewardAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="process-card border-red-500/30 bg-red-500/10 text-red-400">
                <p className="font-semibold mb-1">Submission error</p>
                <p className="text-sm text-red-300">{formError}</p>
              </div>
            )}

            {/* Title */}
            <div className="process-card">
              <Label htmlFor="title" className="text-base font-semibold mb-2 block">
                Bug Title *
              </Label>
              <Input
                id="title"
                placeholder="Brief, descriptive title of the vulnerability"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-base"
              />
            </div>

            {/* Vulnerability Type */}
            <div className="process-card">
              <Label htmlFor="vulnerability-type" className="text-base font-semibold mb-2 block">
                Vulnerability Type *
              </Label>
              <Select value={vulnerabilityType} onValueChange={setVulnerabilityType} required>
                <SelectTrigger id="vulnerability-type">
                  <SelectValue placeholder="Select vulnerability type" />
                </SelectTrigger>
                <SelectContent>
                  {vulnerabilityOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="process-card">
              <Label htmlFor="description" className="text-base font-semibold mb-2 block">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the vulnerability, including what you discovered and why it's a security issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                className="text-base resize-none"
              />
            </div>

            {/* Steps to Reproduce */}
            <div className="process-card">
              <Label htmlFor="steps" className="text-base font-semibold mb-2 block">
                Steps to Reproduce *
              </Label>
              <Textarea
                id="steps"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. Enter...&#10;4. Observe..."
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                required
                rows={8}
                className="text-base font-mono resize-none"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Provide clear, numbered steps that allow the team to reproduce the issue
              </p>
            </div>

            {/* Impact Assessment */}
            <div className="process-card">
              <Label htmlFor="impact" className="text-base font-semibold mb-2 block">
                Impact Assessment *
              </Label>
              <Select value={impact} onValueChange={setImpact} required>
                <SelectTrigger id="impact">
                  <SelectValue placeholder="Select impact level" />
                </SelectTrigger>
                <SelectContent>
                  {IMPACT_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proof of Concept */}
            <div className="process-card">
              <Label htmlFor="poc" className="text-base font-semibold mb-2 block">
                Proof of Concept <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="poc"
                placeholder="Code snippets, URLs, or other technical details demonstrating the vulnerability"
                value={proofOfConcept}
                onChange={(e) => setProofOfConcept(e.target.value)}
                rows={6}
                className="text-base font-mono resize-none"
              />
            </div>

            {/* File Attachments */}
            <div className="process-card">
              <Label htmlFor="attachments" className="text-base font-semibold mb-2 block">
                Attachments <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-yellow-400/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload screenshots, videos, or other supporting files
                  </p>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*,.pdf"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Important Notice */}
            <div className="process-card bg-yellow-400/5 border-yellow-400/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-400">Important Guidelines</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Ensure your submission is within the bounty scope</li>
                    <li>Do not test on production systems without permission</li>
                    <li>Provide clear, reproducible steps</li>
                    <li>Be professional and respectful in your communication</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/bounties/${bountyId}`)}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 btn-primary">
                {submitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Page({ params }: RouteParams<{ bountyId: string }>) {
  return <SubmitBugReportPage params={params} />
}