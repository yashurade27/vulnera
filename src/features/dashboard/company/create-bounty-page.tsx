"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  FileText,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CompanySummary {
  id: string
  name: string
  walletAddress?: string | null
}

interface BountyFormData {
  title: string
  description: string
  bountyType: string
  targetUrl: string
  inScope: string
  outOfScope: string
  requirements: string
  rewardAmount: number
  maxSubmissions: number
  startDate: string
  endDate: string
}

const BOUNTY_TYPES = [
  { value: "UI", label: "UI/UX Issues", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { value: "FUNCTIONALITY", label: "Functionality Bugs", color: "bg-green-500/10 text-green-400 border-green-500/30" },
  { value: "PERFORMANCE", label: "Performance Issues", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { value: "SECURITY", label: "Security Vulnerabilities", color: "bg-red-500/10 text-red-400 border-red-500/30" },
]

interface EscrowInfo {
  escrowAddress: string
  expectedAmount: number
}

export function CreateBountyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [company, setCompany] = useState<CompanySummary | null>(null)
  const [formData, setFormData] = useState<BountyFormData>({
    title: "",
    description: "",
    bountyType: "",
    targetUrl: "",
    inScope: "",
    outOfScope: "",
    requirements: "",
    rewardAmount: 0,
    maxSubmissions: 0,
    startDate: "",
    endDate: "",
  })
  const [txSignature, setTxSignature] = useState("")
  const [createdBountyId, setCreatedBountyId] = useState<string | null>(null)
  const [escrowInfo, setEscrowInfo] = useState<EscrowInfo | null>(null)
  const [creating, setCreating] = useState(false)
  const [funding, setFunding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fundingError, setFundingError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadCompany = async () => {
      try {
        const res = await fetch("/api/companies/my-company", { credentials: "include" })
        if (!res.ok) {
          throw new Error("Unable to load company profile")
        }
        const payload = await res.json()
        if (active) {
          setCompany(payload?.company ?? null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load company information")
        }
      }
    }
    void loadCompany()
    return () => {
      active = false
    }
  }, [])

  const updateFormData = (field: keyof BountyFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const totalEscrowAmount = useMemo(() => {
    const reward = Number.isFinite(formData.rewardAmount) ? formData.rewardAmount : 0
    const max = Number.isFinite(formData.maxSubmissions) ? formData.maxSubmissions : 0
    return reward * (max || 1)
  }, [formData.rewardAmount, formData.maxSubmissions])

  const lamportsAmount = useMemo(() => Math.round(totalEscrowAmount * 1_000_000_000), [totalEscrowAmount])

  const splitLines = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

  const handleCreateBounty = async () => {
    if (!company?.id) {
      setError("Company context is missing")
      return
    }

    if (!formData.title || !formData.description || !formData.bountyType || !formData.requirements) {
      setError("Please complete all required fields")
      return
    }

    try {
      setCreating(true)
      setError(null)

      const payload: Record<string, unknown> = {
        companyId: company.id,
        title: formData.title,
        description: formData.description,
        bountyType: formData.bountyType,
        targetUrl: formData.targetUrl || undefined,
        rewardAmount: formData.rewardAmount.toString(),
        maxSubmissions: formData.maxSubmissions || undefined,
        inScope: splitLines(formData.inScope),
        outOfScope: splitLines(formData.outOfScope),
        requirements: formData.requirements,
        guidelines: formData.requirements,
        startsAt: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endsAt: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      }

      const createRes = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const createJson = await createRes.json()
      if (!createRes.ok) {
        throw new Error(createJson?.error ?? "Failed to create bounty")
      }

      const bountyId: string | undefined = createJson?.bounty?.id
      if (!bountyId) {
        throw new Error("Unexpected response from bounty creation")
      }
      setCreatedBountyId(bountyId)

      if (company.walletAddress) {
        const escrowRes = await fetch("/api/blockchain/create-escrow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ownerWallet: company.walletAddress,
            amount: lamportsAmount,
          }),
        })
        const escrowJson = await escrowRes.json()
        if (!escrowRes.ok) {
          throw new Error(escrowJson?.error ?? "Unable to derive escrow address")
        }
        setEscrowInfo({
          escrowAddress: escrowJson?.escrowAddress,
          expectedAmount: escrowJson?.expectedAmount,
        })
      }
    } catch (err) {
      setCreatedBountyId(null)
      setEscrowInfo(null)
      setError(err instanceof Error ? err.message : "Unable to create bounty")
    } finally {
      setCreating(false)
    }
  }

  const handleFundBounty = async () => {
    if (!createdBountyId || !escrowInfo?.escrowAddress) {
      setFundingError("Create the bounty and derive the escrow address first")
      return
    }
    if (!txSignature) {
      setFundingError("Enter the transaction signature from your wallet")
      return
    }

    try {
      setFunding(true)
      setFundingError(null)
      const fundRes = await fetch(`/api/bounties/${createdBountyId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          txSignature: txSignature.trim(),
          escrowAddress: escrowInfo.escrowAddress,
        }),
      })
      const fundJson = await fundRes.json()
      if (!fundRes.ok) {
        throw new Error(fundJson?.error ?? "Funding verification failed")
      }
      router.push(`/bounties/${createdBountyId}`)
    } catch (err) {
      setFundingError(err instanceof Error ? err.message : "Unable to verify funding")
    } finally {
      setFunding(false)
    }
  }

  const steps = [
    { number: 1, title: "Basic Info", icon: FileText },
    { number: 2, title: "Target & Scope", icon: CheckCircle2 },
    { number: 3, title: "Requirements", icon: FileText },
    { number: 4, title: "Reward & Timeline", icon: DollarSign },
    { number: 5, title: "Fund Bounty", icon: Wallet },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-8 space-y-2">
          <h1 className="text-4xl font-bold">Create New Bounty</h1>
          <p className="text-muted-foreground">
            {company?.name ? `Launch a new program for ${company.name}` : "Set up a new bug bounty program"}
          </p>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      </div>

      <div className="container-custom py-8 space-y-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((s, index) => {
            const StepIcon = s.icon
            const reached = step >= s.number
            const completed = step > s.number || (s.number === 5 && createdBountyId)
            return (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      completed
                        ? "bg-yellow-400 border-yellow-400 text-gray-900"
                        : reached
                        ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-400"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {completed ? <CheckCircle2 className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                  </div>
                  <p className="text-xs mt-2 text-center font-medium">{s.title}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-all ${step > s.number ? "bg-yellow-400" : "bg-border"}`} />
                )}
              </div>
            )
          })}
        </div>

        <Card className="card-glass max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              Step {step}: {steps[step - 1].title}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Provide the core bounty information"}
              {step === 2 && "Define where hunters should focus"}
              {step === 3 && "Outline expectations and submission requirements"}
              {step === 4 && "Configure rewards and schedule"}
              {step === 5 && "Fund the escrow and finalize"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Bounty Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Harden the dashboard authentication flow"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the program goals and context"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    className="mt-2 min-h-32"
                  />
                </div>
                <div>
                  <Label htmlFor="bountyType">Bounty Type</Label>
                  <Select value={formData.bountyType} onValueChange={(value) => updateFormData("bountyType", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select bounty type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOUNTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={type.color}>
                              {type.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="targetUrl">Target URL</Label>
                  <Input
                    id="targetUrl"
                    placeholder="https://app.example.com"
                    value={formData.targetUrl}
                    onChange={(e) => updateFormData("targetUrl", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="inScope">In Scope</Label>
                  <Textarea
                    id="inScope"
                    placeholder="One item per line"
                    value={formData.inScope}
                    onChange={(e) => updateFormData("inScope", e.target.value)}
                    className="mt-2 min-h-32"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Example: Dashboard, API endpoints /v1, mobile apps</p>
                </div>
                <div>
                  <Label htmlFor="outOfScope">Out of Scope</Label>
                  <Textarea
                    id="outOfScope"
                    placeholder="One item per line"
                    value={formData.outOfScope}
                    onChange={(e) => updateFormData("outOfScope", e.target.value)}
                    className="mt-2 min-h-32"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Example: Third-party services, staging environment</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="requirements">Requirements & Guidelines</Label>
                  <Textarea
                    id="requirements"
                    placeholder="Provide submission format, required evidence, test accounts, etc."
                    value={formData.requirements}
                    onChange={(e) => updateFormData("requirements", e.target.value)}
                    className="mt-2 min-h-64"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rewardAmount">Reward per Submission (in SOL)</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="rewardAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.rewardAmount || ""}
                        onChange={(e) => updateFormData("rewardAmount", Number(e.target.value))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="maxSubmissions">Maximum Payouts</Label>
                    <Input
                      id="maxSubmissions"
                      type="number"
                      min="1"
                      value={formData.maxSubmissions || ""}
                      onChange={(e) => updateFormData("maxSubmissions", Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                  <p className="text-sm font-semibold text-yellow-400">
                    Escrow Required: {totalEscrowAmount ? `${totalEscrowAmount} SOL` : "0 SOL"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Converted to {lamportsAmount.toLocaleString()} lamports</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateFormData("startDate", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateFormData("endDate", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center py-6 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto">
                    <Wallet className="w-10 h-10 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Fund Escrow</h3>
                  <p className="text-muted-foreground">
                    Create the bounty, derive the escrow address, then confirm the on-chain transaction.
                  </p>
                </div>

                {createdBountyId ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-card border border-border">
                      <p className="text-sm font-semibold mb-2">Bounty Created</p>
                      <p className="text-xs text-muted-foreground">ID: {createdBountyId}</p>
                    </div>
                    {escrowInfo ? (
                      <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 space-y-2">
                        <p className="text-sm font-semibold text-yellow-400">Escrow Address</p>
                        <p className="text-xs font-mono break-all">{escrowInfo.escrowAddress}</p>
                        <p className="text-xs text-muted-foreground">
                          Expected deposit: {escrowInfo.expectedAmount?.toLocaleString()} lamports
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Wallet information missing—ensure your company profile has a wallet address to derive the escrow.
                      </p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="txSignature">Blockchain Transaction Signature</Label>
                      <Input
                        id="txSignature"
                        placeholder="Paste the signature after funding the escrow"
                        value={txSignature}
                        onChange={(e) => setTxSignature(e.target.value)}
                      />
                      {fundingError ? <p className="text-xs text-red-400">{fundingError}</p> : null}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                        onClick={handleFundBounty}
                        disabled={funding}
                      >
                        {funding ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                            Verifying...
                          </>
                        ) : (
                          "Confirm Funding"
                        )}
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/bounties/${createdBountyId}`}>View Bounty</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-card border border-border text-sm text-muted-foreground">
                      <p>Finalize the setup to derive the escrow address based on your configured reward pool.</p>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                      size="lg"
                      onClick={handleCreateBounty}
                      disabled={creating}
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        "Create Bounty"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <div className="flex items-center justify-between px-6 pb-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {step < 5 ? (
              <Button
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                onClick={() => setStep((prev) => Math.min(5, prev + 1))}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
