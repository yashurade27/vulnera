"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js"
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
import { MIN_ESCROW_AMOUNT } from "@/lib/solana"
import { WalletConnectionGuide } from "@/components/wallet-connection-guide"


interface EscrowInfo {
  escrowAddress: string
  expectedAmount: number
}

export function CreateBountyPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey, connected } = wallet
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
  const [funding, setFunding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fundingError, setFundingError] = useState<string | null>(null)
  const [walletInput, setWalletInput] = useState("")
  const [savingWallet, setSavingWallet] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any[]>([])
  
  // Add debug logging helper
  const addDebugLog = (step: string, data: any) => {
    const logEntry = { timestamp: new Date().toISOString(), step, data }
    console.log('[CreateBounty Debug]', logEntry)
    setDebugInfo(prev => [...prev, logEntry])
  }

  // Track wallet connection state changes with error handling
  useEffect(() => {
    try {
      const walletStateData = {
        connected: !!connected,
        publicKey: publicKey?.toBase58() || null,
        hasProgram: !!program,
        sessionStatus: sessionStatus || 'unknown',
        walletReady: (wallet as any)?.readyState || 'unknown',
        walletName: (wallet as any)?.adapter?.name || 'unknown',
        programId: program?.programId?.toBase58() || null,
        walletError: (wallet as any)?.adapter?.lastError?.message || null
      }
      
      addDebugLog('WALLET_STATE_CHANGE', walletStateData)
      console.log('[CreateBounty] Wallet state changed:', walletStateData)
      
      // Clear previous errors if wallet is now connected
      if (connected && fundingError?.includes('wallet')) {
        setFundingError(null)
      }
    } catch (error) {
      console.error('[CreateBounty] Error tracking wallet state:', error)
      addDebugLog('WALLET_STATE_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      })
    }
  }, [connected, publicKey, program, sessionStatus, wallet, fundingError])

  useEffect(() => {
    // Wait for session to be ready before loading company
    if (sessionStatus === "loading") {
      return
    }

    if (sessionStatus === "unauthenticated") {
      router.push("/auth/login")
      return
    }

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
  }, [sessionStatus, router])

  const updateFormData = <K extends keyof BountyFormData>(field: K, value: BountyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Wallet connection helper with error handling
  const handleWalletConnection = async () => {
    try {
      addDebugLog('WALLET_CONNECT_ATTEMPT', { 
        walletReady: (wallet as any)?.readyState,
        adapter: (wallet as any)?.adapter?.name 
      })
      
      // Check if wallet is ready before connecting
      if ((wallet as any)?.readyState !== 'Installed') {
        throw new Error('Wallet not installed or ready')
      }
      
      if (!(wallet as any)?.connect) {
        throw new Error('Wallet adapter not available')
      }
      
      await (wallet as any).connect()
      addDebugLog('WALLET_CONNECT_SUCCESS', { connected: true })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown wallet error'
      console.error('[CreateBounty] Wallet connection failed:', error)
      addDebugLog('WALLET_CONNECT_ERROR', { error: errorMsg })
      
      // Provide helpful error messages based on error type
      if (error instanceof Error && error.name === 'WalletNotReadyError') {
        setFundingError('Please install a Solana wallet extension and refresh the page')
      } else if (errorMsg.includes('not installed')) {
        setFundingError('Wallet not installed - please install Phantom, Solflare, or another Solana wallet')
      } else {
        setFundingError(`Wallet connection failed: ${errorMsg}`)
      }
    }
  }
  
  // Wallet readiness check
  useEffect(() => {
    const checkWalletReadiness = () => {
      const readyState = (wallet as any)?.readyState
      addDebugLog('WALLET_READINESS_CHECK', {
        readyState,
        hasWallet: !!wallet,
        walletName: (wallet as any)?.adapter?.name
      })
    }
    
    checkWalletReadiness()
    
    // Listen for wallet state changes
    const interval = setInterval(checkWalletReadiness, 5000)
    return () => clearInterval(interval)
  }, [wallet, addDebugLog])

  const lamportsAmount = useMemo(() => {
    try {
      // Defensive check for form data
      if (!formData?.rewardAmount || !formData?.maxSubmissions) {
        return 0
      }
      
      const reward = Number.parseFloat(formData.rewardAmount)
      const max = Number.parseFloat(formData.maxSubmissions)

      // Extra validation
      if (!Number.isFinite(reward) || !Number.isFinite(max) || reward <= 0 || max <= 0) {
        return 0
      }

      const rewardLamports = Math.round(reward * LAMPORTS_PER_SOL)
      const maxValue = Math.floor(max)

      if (rewardLamports <= 0 || maxValue <= 0) {
        return 0
      }

      const product = rewardLamports * maxValue
      if (!Number.isSafeInteger(product) || product <= 0) {
        return Number.MAX_SAFE_INTEGER
      }

      return product
    } catch (error) {
      console.error('[CreateBounty] Error calculating lamportsAmount:', error)
      return 0
    }
  }, [formData?.rewardAmount, formData?.maxSubmissions])

  const totalEscrowAmount = useMemo(() => {
    if (lamportsAmount === Number.MAX_SAFE_INTEGER) {
      return Number.MAX_SAFE_INTEGER
    }
    return lamportsAmount / LAMPORTS_PER_SOL
  }, [lamportsAmount])

  const totalEscrowDisplay = useMemo(() => {
    if (totalEscrowAmount === Number.MAX_SAFE_INTEGER) {
      return "∞"
    }

    if (totalEscrowAmount === 0) {
      return "0"
    }

    return totalEscrowAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 9,
    })
  }, [totalEscrowAmount])

  const minEscrowSol = MIN_ESCROW_AMOUNT / LAMPORTS_PER_SOL

  const minEscrowDisplay = useMemo(
    () => minEscrowSol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [minEscrowSol]
  )

  const hasRequiredFields = Boolean(
    formData.title.trim() &&
      formData.description.trim() &&
      formData.requirements.trim() &&
      formData.bountyTypes.length > 0
  )

  const meetsMinimumEscrow = lamportsAmount >= MIN_ESCROW_AMOUNT

  const exceedsSafeAmount = useMemo(() => {
    try {
      return lamportsAmount === Number.MAX_SAFE_INTEGER || lamportsAmount >= Number.MAX_SAFE_INTEGER
    } catch (error) {
      console.error('[CreateBounty] Error checking safe amount:', error)
      return true // Assume unsafe if we can't check
    }
  }, [lamportsAmount])

  const canFundBounty = Boolean(
    !funding &&
      sessionStatus === "authenticated" &&
      company?.walletAddress &&
      publicKey &&
      connected &&
      hasRequiredFields &&
      meetsMinimumEscrow &&
      !exceedsSafeAmount
  )

  const splitLines = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

  // Safe lamports display helper
  const safeLamportsDisplay = (amount: number): string => {
    try {
      if (!Number.isFinite(amount) || amount < 0) return '0'
      if (amount >= Number.MAX_SAFE_INTEGER) return 'unsafe amount'
      return amount.toLocaleString()
    } catch (error) {
      console.error('[CreateBounty] Error formatting lamports:', error)
      return 'error'
    }
  }

  const handleCreateBounty = async () => {
    // This function is now integrated into handleInitializeEscrow
    // Keeping for potential future use
  }

  const handleInitializeEscrow = async () => {
    // Early safety check to prevent BN errors
    try {
      if (!Number.isFinite(lamportsAmount) || lamportsAmount <= 0) {
        setFundingError(`Invalid escrow amount: ${lamportsAmount}. Please check your reward and submission values.`)
        return
      }
      
      // Test BN creation early to catch any issues
      new BN(lamportsAmount.toString())
    } catch (bnError) {
      console.error('[CreateBounty] BN creation test failed:', bnError)
      setFundingError(`Cannot process escrow amount: ${lamportsAmount}. Please reduce your values.`)
      return
    }
    const initData = {
      sessionStatus,
      connected,
      hasPublicKey: !!publicKey,
      hasProgram: !!program,
      companyId: company?.id,
      companyWallet: company?.walletAddress,
      connectedWallet: publicKey?.toBase58(),
      lamportsAmount,
      minEscrowDisplay,
      canFundBounty,
      formDataValid: {
        title: !!formData.title.trim(),
        description: !!formData.description.trim(),
        bountyTypes: formData.bountyTypes.length > 0,
        requirements: !!formData.requirements.trim()
      }
    }
    
    addDebugLog('INITIALIZATION_START', initData)
    console.log('[CreateBounty] Starting escrow initialization', initData)

    if (sessionStatus !== "authenticated") {
      const errorMsg = "Please ensure you are logged in before funding the bounty."
      const errorData = { sessionStatus, hasSession: !!session }
      addDebugLog('AUTH_ERROR', errorData)
      console.error('[CreateBounty] Auth error:', errorMsg, errorData)
      setFundingError(errorMsg)
      return
    }

    if (!connected || !publicKey) {
      const errorMsg = "Please connect your Solana wallet before funding the bounty."
      const errorData = { connected, hasPublicKey: !!publicKey, walletStatus: (wallet as any)?.adapter?.name }
      addDebugLog('WALLET_ERROR', errorData)
      console.error('[CreateBounty] Wallet error:', errorMsg, errorData)
      setFundingError(errorMsg)
      return
    }

    if (!program || !company?.id) {
      const errorMsg = "Missing required information to fund the bounty."
      const errorData = { 
        hasProgram: !!program, 
        companyId: company?.id,
        programId: program?.programId?.toBase58(),
        providerWallet: program?.provider?.wallet?.publicKey?.toBase58()
      }
      addDebugLog('PROGRAM_ERROR', errorData)
      console.error('[CreateBounty] Missing requirements:', errorMsg, errorData)
      setFundingError(errorMsg)
      return
    }

    if (company.walletAddress && company.walletAddress !== publicKey.toBase58()) {
      const errorMsg = "Connected wallet does not match the company wallet on file."
      const errorData = {
        companyWallet: company.walletAddress,
        connectedWallet: publicKey.toBase58(),
        walletName: (wallet as any)?.adapter?.name
      }
      addDebugLog('WALLET_MISMATCH', errorData)
      console.error('[CreateBounty] Wallet mismatch:', errorMsg, errorData)
      setFundingError(errorMsg)
      return
    }

    if (!meetsMinimumEscrow) {
      setFundingError(`Minimum escrow is ${minEscrowDisplay} SOL. Increase the reward or max payouts.`)
      return
    }

    if (exceedsSafeAmount || !Number.isSafeInteger(lamportsAmount)) {
      setFundingError("Escrow amount exceeds the supported numeric range. Reduce the reward or max payouts.")
      return
    }

    if (lamportsAmount <= 0) {
      setFundingError("Escrow amount must be greater than zero.")
      return
    }

    try {
      setFunding(true)
      setFundingError(null)

      // Create bounty first if not already created
      let bountyId: string
      const createPayload: Record<string, unknown> = {
        companyId: company.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        bountyTypes: formData.bountyTypes,
        targetUrl: formData.targetUrl || undefined,
        rewardAmount: formData.rewardAmount ? Number.parseFloat(formData.rewardAmount).toString() : "0",
        maxSubmissions: formData.maxSubmissions ? Number.parseFloat(formData.maxSubmissions) : undefined,
        inScope: splitLines(formData.inScope),
        outOfScope: splitLines(formData.outOfScope),
        requirements: formData.requirements.trim(),
        guidelines: undefined,
        startsAt: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endsAt: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      }

      addDebugLog('BOUNTY_CREATION_START', createPayload)
      console.log("Creating bounty before funding", createPayload)

      const createRes = await fetch("/api/bounties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createPayload),
      })

      const createJson = await createRes.json()
      
      addDebugLog('BOUNTY_CREATION_RESPONSE', { 
        status: createRes.status, 
        ok: createRes.ok, 
        response: createJson 
      })
      
      if (!createRes.ok) {
        console.error("Bounty creation failed", createRes.status, createJson)
        throw new Error(createJson?.error ?? "Failed to create bounty")
      }

      bountyId = createJson?.bounty?.id
      if (!bountyId) {
        throw new Error("Unexpected response from bounty creation")
      }

      // Derive escrow
      const escrowPayload = {
        ownerWallet: company.walletAddress,
        amount: lamportsAmount,
      }
      
      addDebugLog('ESCROW_DERIVATION_START', escrowPayload)
      
      const escrowRes = await fetch("/api/blockchain/create-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(escrowPayload),
      })
      
      const escrowJson = await escrowRes.json()
      
      addDebugLog('ESCROW_DERIVATION_RESPONSE', {
        status: escrowRes.status,
        ok: escrowRes.ok,
        response: escrowJson
      })
      
      if (!escrowRes.ok) {
        console.error("Escrow derivation failed", escrowRes.status, escrowJson)
        throw new Error(escrowJson?.error ?? "Unable to derive escrow address")
      }
      const escrowAddress = typeof escrowJson?.escrowAddress === "string" ? escrowJson.escrowAddress : ""
      const expectedAmount = Number(escrowJson?.expectedAmount ?? 0)

      if (!escrowAddress) {
        throw new Error("Escrow address was not returned by the server")
      }

      if (!Number.isFinite(expectedAmount) || expectedAmount < MIN_ESCROW_AMOUNT) {
        throw new Error(`Escrow amount must be at least ${minEscrowDisplay} SOL`)
      }

      if (expectedAmount !== lamportsAmount) {
        console.warn("Expected escrow amount mismatch", { expectedAmount, lamportsAmount })
      }

      const [escrowPda] = await PublicKey.findProgramAddress(
        [Buffer.from("bounty-escrow"), publicKey.toBuffer()],
        program.programId
      );

      addDebugLog('PDA_DERIVATION', {
        escrowPda: escrowPda.toBase58(),
        programId: program.programId.toBase58(),
        owner: publicKey.toBase58()
      })

      // Check if the account already exists
      const accountInfo = await connection.getAccountInfo(escrowPda);

      addDebugLog('ACCOUNT_INFO_CHECK', {
        escrowPda: escrowPda.toBase58(),
        accountExists: !!accountInfo,
        accountOwner: accountInfo?.owner?.toBase58(),
        accountLamports: accountInfo?.lamports,
        accountDataLength: accountInfo?.data?.length
      })

      let signature: string;
      
      // Validate lamportsAmount before creating BN
      if (!Number.isFinite(lamportsAmount) || lamportsAmount <= 0) {
        throw new Error(`Invalid escrow amount: ${lamportsAmount}`)
      }
      
      if (lamportsAmount > Number.MAX_SAFE_INTEGER) {
        throw new Error(`Escrow amount too large: ${lamportsAmount}`)
      }
      
      addDebugLog('BN_CREATION', {
        lamportsAmount,
        lamportsAmountType: typeof lamportsAmount,
        isFinite: Number.isFinite(lamportsAmount),
        isSafeInteger: Number.isSafeInteger(lamportsAmount)
      })
      
      const amountBn = new BN(lamportsAmount.toString())

      try {
        if (accountInfo === null) {
          // Account doesn't exist, so initialize it
          const initData = {
            escrowPda: escrowPda.toBase58(),
            lamportsAmount,
            amountBn: amountBn.toString()
          }
          addDebugLog('INITIALIZING_VAULT', initData)
          console.log("Vault account not found. Initializing...", initData)
          
          signature = await program.methods
            .initialize(amountBn)
            .accounts({
              vault: escrowPda,
              owner: publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
            
          addDebugLog('INITIALIZE_SUCCESS', { signature })
        } else {
          // Account exists, so deposit into it
          const depositData = {
            escrowPda: escrowPda.toBase58(),
            lamportsAmount,
            amountBn: amountBn.toString(),
            existingLamports: accountInfo.lamports
          }
          addDebugLog('DEPOSITING_TO_VAULT', depositData)
          console.log("Vault account found. Depositing funds...", depositData)
          
          signature = await program.methods
            .deposit(amountBn)
            .accounts({
              vault: escrowPda,
              owner: publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
            
          addDebugLog('DEPOSIT_SUCCESS', { signature })
        }

        addDebugLog('TRANSACTION_SUCCESS', { signature })
        console.log("Transaction successful with signature:", signature);
      } catch (txError) {
        addDebugLog('TRANSACTION_ERROR', {
          error: txError instanceof Error ? txError.message : String(txError),
          stack: txError instanceof Error ? txError.stack : undefined,
          amountBn: amountBn.toString(),
          escrowPda: escrowPda.toBase58()
        })
        throw txError
      }

      // Verify with backend
      const fundPayload = {
        txSignature: signature,
        escrowAddress: escrowPda.toBase58(),
      }
      
      addDebugLog('FUNDING_VERIFICATION_START', fundPayload)
      
      const fundRes = await fetch(`/api/bounties/${bountyId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fundPayload),
      })

      const fundJson = await fundRes.json()
      
      addDebugLog('FUNDING_VERIFICATION_RESPONSE', {
        status: fundRes.status,
        ok: fundRes.ok,
        response: fundJson
      })
      
      if (!fundRes.ok) {
        throw new Error(fundJson?.error ?? "Funding verification failed")
      }

      addDebugLog('FUNDING_SUCCESS', { bountyId, redirecting: true })
      // Redirect on success
      router.push(`/bounties/${bountyId}`)
    } catch (err) {
      const errorData = {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'UnknownError',
        debugInfo: debugInfo.slice(-5) // Last 5 debug entries
      }
      
      addDebugLog('FUNDING_ERROR', errorData)
      console.error("Funding error:", err, errorData)
      
      // Set user-friendly error message
      let userMessage = "Unable to send funding transaction."
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          userMessage = "Transaction was cancelled by user."
        } else if (err.message.includes('Insufficient funds')) {
          userMessage = "Insufficient funds in your wallet."
        } else if (err.message.includes('Blockhash not found')) {
          userMessage = "Transaction timeout. Please try again."
        } else {
          userMessage = err.message
        }
      }
      
      setFundingError(userMessage)
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

  // Show loading state while session is being fetched
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

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
                    Escrow Required: {totalEscrowDisplay === "0" ? "0 SOL" : `${totalEscrowDisplay} SOL`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Converted to {exceedsSafeAmount ? "an unsafe amount" : safeLamportsDisplay(lamportsAmount)} lamports
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum escrow: {minEscrowDisplay} SOL ({MIN_ESCROW_AMOUNT.toLocaleString()} lamports)
                  </p>
                  {exceedsSafeAmount ? (
                    <p className="text-xs text-red-400 mt-1">
                      The calculated escrow exceeds the supported limit. Please lower the reward or number of payouts.
                    </p>
                  ) : null}
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

                  {/* Wallet Connection Status */}
                  <WalletConnectionGuide 
                    companyWallet={company?.walletAddress || undefined}
                  />

                  {company?.walletAddress ? (
                    <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 space-y-2">
                      <p className="text-sm font-semibold text-yellow-400">Escrow Summary</p>
                      <p className="text-xs text-muted-foreground">
                        Total escrow amount: {totalEscrowDisplay === "0" ? "0 SOL" : `${totalEscrowDisplay} SOL`} ({
                        exceedsSafeAmount ? "unsafe amount" : `${safeLamportsDisplay(lamportsAmount)} lamports`})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Minimum required: {minEscrowDisplay} SOL
                      </p>
                      {!meetsMinimumEscrow ? (
                        <p className="text-xs text-red-400">
                          ⚠️ Increase the reward or max payouts to meet minimum escrow requirement.
                        </p>
                      ) : (
                        <p className="text-xs text-green-400">
                          ✅ Escrow meets minimum requirement
                        </p>
                      )}
                      {exceedsSafeAmount ? (
                        <p className="text-xs text-red-400">
                          ⚠️ Amount exceeds safe limits. Please reduce reward or maximum payouts.
                        </p>
                      ) : null}
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
                  {/* Error Display with Recovery Options */}
                  {fundingError ? (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400 font-medium mb-2">Funding Error</p>
                      <p className="text-xs text-red-300 mb-3">{fundingError}</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFundingError(null)}
                          className="text-xs"
                        >
                          Dismiss
                        </Button>
                        {fundingError.includes('wallet') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleWalletConnection}
                            className="text-xs"
                          >
                            Retry Connection
                          </Button>
                        )}
                        {fundingError.includes('network') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.location.reload()}
                            className="text-xs"
                          >
                            Refresh Page
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleInitializeEscrow}
                      disabled={!canFundBounty || funding}
                    >
                      {funding ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                          Creating & Funding...
                        </>
                      ) : canFundBounty ? (
                        "Create & Fund Bounty"
                      ) : (
                        "Complete Requirements Above"
                      )}
                    </Button>
                  </div>
                  
                  {/* Validation Messages */}
                  {!canFundBounty && !funding && (
                    <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium mb-2">Complete the following to enable funding:</p>
                      <ul className="space-y-1">
                        {!company?.walletAddress && <li>• Set up company wallet address</li>}
                        {!connected && <li>• Connect your Solana wallet</li>}
                        {connected && publicKey && company?.walletAddress && publicKey.toBase58() !== company.walletAddress && <li>• Connect the correct wallet ({company.walletAddress.slice(0, 8)}...)</li>}
                        {!formData.title && <li>• Add bounty title</li>}
                        {!formData.description && <li>• Add bounty description</li>}
                        {formData.bountyTypes.length === 0 && <li>• Select at least one bounty type</li>}
                        {!formData.rewardAmount && <li>• Set reward amount</li>}
                        {!formData.maxSubmissions && <li>• Set maximum submissions</li>}
                        {!meetsMinimumEscrow && <li>• Increase escrow to meet {minEscrowDisplay} SOL minimum</li>}
                        {exceedsSafeAmount && <li>• Reduce escrow amount to safe limits</li>}
                      </ul>
                    </div>
                  )}
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
        
        {/* Debug Panel - Only show if there are debug entries */}
        {debugInfo.length > 0 && (
          <Card className="mt-6 border-orange-500/20">
            <CardContent className="p-4">
              <details className="space-y-2">
                <summary className="cursor-pointer text-sm font-medium text-orange-400 hover:text-orange-300">
                  Debug Information ({debugInfo.length} entries) - Click to expand
                </summary>
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {debugInfo.map((entry, index) => (
                    <div key={index} className="text-xs bg-gray-900/50 p-2 rounded border border-gray-700">
                      <div className="text-orange-400 font-mono">
                        [{entry.timestamp}] {entry.step}
                      </div>
                      <pre className="text-gray-300 mt-1 whitespace-pre-wrap break-all">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDebugInfo([])}
                    className="text-xs"
                  >
                    Clear Debug Log
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const debugText = debugInfo.map(entry => 
                        `[${entry.timestamp}] ${entry.step}\n${JSON.stringify(entry.data, null, 2)}`
                      ).join('\n\n')
                      navigator.clipboard.writeText(debugText)
                    }}
                    className="text-xs"
                  >
                    Copy Debug Log
                  </Button>
                </div>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
