"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
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
import { Textarea } from "@/components/ui/textarea"

interface CompanySummary {
  id: string
  name: string
  walletAddress?: string | null
}

interface BountyFormData {
  title: string
  description: string
  bountyTypes: string[]
  targetUrl: string
  inScope: string
  outOfScope: string
  requirements: string
  rewardAmount: string
  maxSubmissions: string
  startDate: string
  endDate: string
}

const BOUNTY_TYPES = [
  { value: "UI", label: "UI/UX Issues", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { value: "FUNCTIONALITY", label: "Functionality Bugs", color: "bg-green-500/10 text-green-400 border-green-500/30" },
  { value: "PERFORMANCE", label: "Performance Issues", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { value: "SECURITY", label: "Security Vulnerabilities", color: "bg-red-500/10 text-red-400 border-red-500/30" },
]

import { useProgram } from "@/lib/use-program"
import { BN } from "@coral-xyz/anchor"

interface EscrowInfo {
  escrowAddress: string
  expectedAmount: number
}

export function CreateBountyPage() {
  const router = useRouter()
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const { program } = useProgram()

  const [step, setStep] = useState(1)
  const [company, setCompany] = useState<CompanySummary | null>(null)
  const [formData, setFormData] = useState<BountyFormData>({
    title: "",
    description: "",
    bountyTypes: [],
    targetUrl: "",
    inScope: "",
    outOfScope: "",
    requirements: "",
    rewardAmount: "",
    maxSubmissions: "",
    startDate: "",
    endDate: "",
  })
  const [txSignature, setTxSignature] = useState("")
  const [funding, setFunding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fundingError, setFundingError] = useState<string | null>(null)
  const [walletInput, setWalletInput] = useState("")
  const [savingWallet, setSavingWallet] = useState(false)

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

  const updateFormData = <K extends keyof BountyFormData>(field: K, value: BountyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const totalEscrowAmount = useMemo(() => {
    const reward = Number.parseFloat(formData.rewardAmount)
    const max = Number.parseFloat(formData.maxSubmissions)
    const rewardValue = Number.isFinite(reward) && reward > 0 ? reward : 0
    const maxValue = Number.isFinite(max) && max > 0 ? max : 0
    if (maxValue === 0) {
      return rewardValue
    }
    return rewardValue * maxValue
  }, [formData.rewardAmount, formData.maxSubmissions])

  const lamportsAmount = useMemo(() => {
    const raw = totalEscrowAmount * 1_000_000_000
    if (!Number.isFinite(raw) || raw <= 0) {
      return 0
    }
    return Math.round(raw)
  }, [totalEscrowAmount])

  const splitLines = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

  const handleCreateBounty = async () => {
    // This function is now integrated into handleInitializeEscrow
    // Keeping for potential future use
  }

  const handleInitializeEscrow = async () => {
    if (!program || !publicKey || !company?.id) {
      setFundingError("Missing required information to fund the bounty.")
      return
    }

    try {
      setFunding(true)
      setFundingError(null)

      // Create bounty first if not already created
      let bountyId: string
      const createPayload: Record<string, unknown> = {
        companyId: company.id,
        title: formData.title,
        description: formData.description,
        bountyTypes: formData.bountyTypes,
        targetUrl: formData.targetUrl || undefined,
        rewardAmount: formData.rewardAmount ? Number.parseFloat(formData.rewardAmount).toString() : "0",
        maxSubmissions: formData.maxSubmissions ? Number.parseFloat(formData.maxSubmissions) : undefined,
        inScope: splitLines(formData.inScope),
        outOfScope: splitLines(formData.outOfScope),
        requirements: formData.requirements,
        guidelines: formData.requirements,
        startsAt: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endsAt: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      }

      console.log("Creating bounty before funding", createPayload)

      const createRes = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createPayload),
      })

      const createJson = await createRes.json()
      if (!createRes.ok) {
        console.error("Bounty creation failed", createRes.status, createJson)
        throw new Error(createJson?.error ?? "Failed to create bounty")
      }

      bountyId = createJson?.bounty?.id
      if (!bountyId) {
        throw new Error("Unexpected response from bounty creation")
      }

      // Derive escrow
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
        console.error("Escrow derivation failed", escrowRes.status, escrowJson)
        throw new Error(escrowJson?.error ?? "Unable to derive escrow address")
      }
      const escrowInfoLocal = {
        escrowAddress: escrowJson?.escrowAddress,
        expectedAmount: escrowJson?.expectedAmount,
      }

      const [escrowPda] = await PublicKey.findProgramAddress(
        [Buffer.from("bounty-escrow"), publicKey.toBuffer()],
        program.programId
      );

      // Check if the account already exists
      const accountInfo = await connection.getAccountInfo(escrowPda);

      let signature: string;
      if (accountInfo === null) {
        // Account doesn't exist, so initialize it
        console.log("Vault account not found. Initializing...");
        signature = await program.methods
          .initialize(new BN(escrowInfoLocal.expectedAmount))
          .accounts({
            vault: escrowPda,
            owner: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } else {
        // Account exists, so deposit into it
        console.log("Vault account found. Depositing funds...");
        signature = await program.methods
          .deposit(new BN(escrowInfoLocal.expectedAmount))
          .accounts({
            vault: escrowPda,
            owner: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      console.log("Transaction successful with signature:", signature);

      // Verify with backend
      const fundRes = await fetch(`/api/bounties/${bountyId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          txSignature: signature,
          escrowAddress: escrowPda.toBase58(),
        }),
      })

      const fundJson = await fundRes.json()
      if (!fundRes.ok) {
        throw new Error(fundJson?.error ?? "Funding verification failed")
      }

      // Redirect on success
      router.push(`/bounties/${bountyId}`)
    } catch (err) {
      console.error("Funding error:", err)
      setFundingError(err instanceof Error ? err.message : "Unable to send funding transaction.")
    } finally {
      setFunding(false)
    }
  }

  const handleSaveWallet = async () => {
    if (!company?.id || !walletInput.trim()) {
      setError("Please enter a valid wallet address")
      return
    }

    setSavingWallet(true)
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ walletAddress: walletInput.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || "Failed to update wallet address")
      }

      // Update the company state
      setCompany((prev) => prev ? { ...prev, walletAddress: walletInput.trim() } : null)
      setWalletInput("")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save wallet address")
    } finally {
      setSavingWallet(false)
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
          <pre className="hidden" data-debug-state>
            {JSON.stringify({ step, hasCompany: Boolean(company), formData }, null, 2)}
          </pre>
        </div>
      </div>

      <div className="container-custom py-8 space-y-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((s, index) => {
            const StepIcon = s.icon
            const reached = step >= s.number
            const completed = step > s.number
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {BOUNTY_TYPES.map((type) => {
                      const selected = formData.bountyTypes.includes(type.value)
                      return (
                        <Button
                          key={type.value}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          className={
                            selected
                              ? "bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-300"
                              : "border-dashed"
                          }
                          onClick={() => {
                            setFormData((prev) => {
                              const next = selected
                                ? prev.bountyTypes.filter((v) => v !== type.value)
                                : [...prev.bountyTypes, type.value]
                              return { ...prev, bountyTypes: next }
                            })
                          }}
                        >
                          <Badge variant="outline" className={type.color}>
                            {type.label}
                          </Badge>
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Select all vulnerability categories that apply.</p>
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
                        value={formData.rewardAmount}
                        onChange={(e) => updateFormData("rewardAmount", e.target.value)}
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
                      step="1"
                      value={formData.maxSubmissions}
                      onChange={(e) => updateFormData("maxSubmissions", e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Use whole numbers. Leave blank for unlimited payouts.</p>
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
                      min={new Date().toISOString().split('T')[0]}
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
                  <h3 className="text-2xl font-bold">Fund Bounty</h3>
                  <p className="text-muted-foreground">
                    Review your bounty details and fund the escrow to launch it on the blockchain.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <h4 className="font-semibold mb-2">Bounty Summary</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Title:</strong> {formData.title || "Not set"}</p>
                      <p><strong>Description:</strong> {formData.description ? `${formData.description.slice(0, 100)}...` : "Not set"}</p>
                      <p><strong>Types:</strong> {formData.bountyTypes.join(", ") || "None"}</p>
                      <p><strong>Reward:</strong> {formData.rewardAmount ? `${formData.rewardAmount} SOL` : "Not set"}</p>
                      <p><strong>Max Submissions:</strong> {formData.maxSubmissions || "Unlimited"}</p>
                    </div>
                  </div>

                  {company?.walletAddress ? (
                    <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 space-y-2">
                      <p className="text-sm font-semibold text-yellow-400">Ready to Fund</p>
                      <p className="text-xs text-muted-foreground">
                        Escrow will be created for {totalEscrowAmount} SOL ({lamportsAmount.toLocaleString()} lamports)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                        <p className="text-sm font-semibold text-yellow-400 mb-2">Wallet Address Required</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Your company needs a wallet address to create and fund bounties on the blockchain.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="walletInput">Solana Wallet Address</Label>
                          <Input
                            id="walletInput"
                            placeholder="Enter your Solana wallet address"
                            value={walletInput}
                            onChange={(e) => setWalletInput(e.target.value)}
                          />
                        </div>
                        <Button
                          className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                          onClick={handleSaveWallet}
                          disabled={savingWallet || !walletInput.trim()}
                        >
                          {savingWallet ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            "Save Wallet Address"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  {fundingError ? <p className="text-xs text-red-400 mt-4">{fundingError}</p> : null}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                      onClick={handleInitializeEscrow}
                      disabled={funding || !company?.walletAddress || !publicKey || !formData.title || !formData.description || formData.bountyTypes.length === 0 || !formData.requirements}
                    >
                      {funding ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                          Creating & Funding...
                        </>
                      ) : (
                        "Create & Fund Bounty"
                      )}
                    </Button>
                  </div>
                </div>
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
