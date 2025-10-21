"use client"

import { useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, AlertCircle, CheckCircle2, Coins } from "lucide-react"
import { toast } from "sonner"

interface AddFundsDialogProps {
  bountyId: string
  bountyTitle: string
  currentEscrowBalance: number // in lamports
  onSuccess?: () => void
}

export function AddFundsDialog({ bountyId, bountyTitle, currentEscrowBalance, onSuccess }: AddFundsDialogProps) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"input" | "signing" | "confirming">("input")
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const handleAddFunds = async () => {
    if (!publicKey || !amount) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid amount greater than 0",
      })
      return
    }

    setLoading(true)
    setStep("signing")

    try {
      // Step 1: Prepare deposit parameters
      const prepareRes = await fetch("/api/blockchain/prepare-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId,
          amount: amountNum,
        }),
        credentials: "include",
      })

      if (!prepareRes.ok) {
        const error = await prepareRes.json()
        throw new Error(error.error || "Failed to prepare deposit")
      }

      const { depositParams } = await prepareRes.json()

      // Step 2: Build the deposit transaction
      const programId = new PublicKey(depositParams.programId)
      const escrowPubkey = new PublicKey(depositParams.escrowAddress)
      const ownerPubkey = new PublicKey(depositParams.ownerWallet)

      // Verify the connected wallet matches the owner
      if (publicKey.toString() !== ownerPubkey.toString()) {
        throw new Error("Connected wallet does not match the bounty owner wallet")
      }

      // Create PDA for vault
      const [vaultPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("bounty-escrow"), ownerPubkey.toBuffer()],
        programId
      )

      // Build deposit instruction
      const depositIx = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: vaultPubkey, isSigner: false, isWritable: true },
          { pubkey: ownerPubkey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([
          3, // Instruction index for deposit
          ...new Uint8Array(new BigUint64Array([BigInt(depositParams.amount)]).buffer),
        ]),
      })

      const transaction = new Transaction().add(depositIx)
      transaction.feePayer = publicKey
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash

      // Step 3: Sign and send transaction
      const signature = await sendTransaction(transaction, connection)
      setTxSignature(signature)
      setStep("confirming")

      // Step 4: Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, "confirmed")

      if (confirmation.value.err) {
        throw new Error("Transaction failed on blockchain")
      }

      // Step 5: Notify backend
      const depositRes = await fetch("/api/blockchain/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bountyId,
          txSignature: signature,
          amount: depositParams.amount,
        }),
        credentials: "include",
      })

      if (!depositRes.ok) {
        const error = await depositRes.json()
        throw new Error(error.error || "Failed to record deposit")
      }

      toast.success("Funds added successfully!", {
        description: `${amountNum} SOL has been added to the bounty escrow.`,
      })

      setOpen(false)
      setAmount("")
      setStep("input")
      setTxSignature(null)
      onSuccess?.()
    } catch (error: any) {
      console.error("Add funds error:", error)
      toast.error("Failed to add funds", {
        description: error.message || "An error occurred while adding funds",
      })
      setStep("input")
    } finally {
      setLoading(false)
    }
  }

  const currentBalanceSOL = currentEscrowBalance / 1_000_000_000

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full btn-primary mt-4 gap-2">
          <Coins className="w-4 h-4" />
          Add Funds to Escrow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to Bounty</DialogTitle>
          <DialogDescription>
            Add more SOL to the escrow account for "{bountyTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Balance */}
          <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-400/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Current Escrow Balance</span>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-xl font-bold text-yellow-400">{currentBalanceSOL.toFixed(4)} SOL</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Available for bounty payouts</p>
          </div>

          {step === "input" && (
            <>
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold">Deposit Amount (SOL)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter amount (e.g., 1.5)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="text-lg font-semibold pl-4 pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    SOL
                  </div>
                </div>
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <p className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    New balance: {(currentBalanceSOL + parseFloat(amount)).toFixed(4)} SOL
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 This will increase the total funds available for bounty rewards
                </p>
              </div>

              {/* Warning */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>⚠️ Smart Contract Update Required:</strong><br/>
                  The deposit function needs to be deployed. Please run:<br/>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">cd anchor && anchor build && anchor deploy</code>
                  <br/><br/>
                  Make sure your wallet is connected and has sufficient balance to cover the deposit amount plus transaction fees.
                </AlertDescription>
              </Alert>
            </>
          )}

          {step === "signing" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Please sign the transaction in your wallet...
              </AlertDescription>
            </Alert>
          )}

          {step === "confirming" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Confirming transaction on blockchain...
                {txSignature && (
                  <p className="text-xs mt-2 font-mono break-all">
                    Signature: {txSignature.substring(0, 20)}...
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 btn-primary"
            onClick={handleAddFunds}
            disabled={!amount || loading || !publicKey || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {step === "signing" ? "Sign Transaction..." : "Confirming..."}
              </>
            ) : (
              <>
                <Coins className="w-4 h-4 mr-2" />
                Deposit {amount || "0"} SOL
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
