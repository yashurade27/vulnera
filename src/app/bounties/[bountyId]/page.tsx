import { BountyDetailsPage } from "@/components/BountyDetailsPage"
import { type RouteParams } from "@/lib/next"

export default function Page({ params }: RouteParams<{ bountyId: string }>) {
  return <BountyDetailsPage params={params} />
}