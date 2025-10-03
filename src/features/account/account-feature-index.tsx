"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSolana } from "@/components/solana/use-solana"
import { WalletDropdown } from "@/components/wallet-dropdown"

export default function AccountFeatureIndex() {
  const router = useRouter()
  const { account } = useSolana()

  useEffect(() => {
    if (account) {
      router.replace(`/account/${account.address.toString()}`)
    }
  }, [account, router])

  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <WalletDropdown />
      </div>
    </div>
  )
}
