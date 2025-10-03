"use client"

import { useState, useEffect } from "react"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com"

export function useEscrowBalance(escrowAddress: string | null) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!escrowAddress) {
      setBalance(0)
      return
    }

    let isActive = true
    const fetchBalance = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed")
        const publicKey = new PublicKey(escrowAddress)
        const lamports = await connection.getBalance(publicKey)
        if (isActive) {
          setBalance(lamports / LAMPORTS_PER_SOL)
        }
      } catch (err) {
        console.error("Failed to fetch escrow balance:", err)
        if (isActive) {
          setError("Failed to fetch balance")
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void fetchBalance()

    return () => {
      isActive = false
    }
  }, [escrowAddress])

  return { balance, isLoading, error }
}
