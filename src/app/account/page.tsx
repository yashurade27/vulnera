"use client"

import dynamic from "next/dynamic"

// Disable SSR for the entire account feature
const AccountFeatureIndex = dynamic(
  () => import("@/features/account/account-feature-index"),
  { ssr: false }
)

export default function Page() {
  return <AccountFeatureIndex />
}
