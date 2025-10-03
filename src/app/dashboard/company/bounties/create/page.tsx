"use client"

import nextDynamic from "next/dynamic"

const CreateBountyPage = nextDynamic(
  () => import("@/features/dashboard/company/create-bounty-page").then((mod) => mod.CreateBountyPage),
  { ssr: false }
)

export const dynamic = "force-dynamic"

export default function CreateBountyRoute() {
  return <CreateBountyPage />
}
