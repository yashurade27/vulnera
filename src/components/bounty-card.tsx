"use client"

import { Calendar, DollarSign, Building2, CheckCircle2, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BountyCardProps {
  bounty: {
    id: string
    title: string
    description: string
    bountyType: string
    rewardAmount: number
    status: string
    endsAt: string | null
    company: {
      id: string
      name: string
      slug: string
      logoUrl: string | null
      isVerified: boolean
    }
    _count: {
      submissions: number
    }
  }
}

const BOUNTY_TYPE_COLORS: Record<string, string> = {
  UI: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  FUNCTIONALITY: "bg-green-500/10 text-green-400 border-green-500/30",
  PERFORMANCE: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  SECURITY: "bg-red-500/10 text-red-400 border-red-500/30",
}

export function BountyCard({ bounty }: BountyCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "No deadline"
    const d = new Date(date)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null
    const now = new Date()
    const end = new Date(date)
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const daysRemaining = getDaysRemaining(bounty.endsAt)

  return (
    <Card className="vulnerability-card group hover:border-yellow-400/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <Building2 className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{bounty.company.name}</p>
                {bounty.company.isVerified && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
              </div>
              <p className="text-xs text-muted-foreground">@{bounty.company.slug}</p>
            </div>
          </div>
          <Badge variant="outline" className={BOUNTY_TYPE_COLORS[bounty.bountyType] || ""}>
            {bounty.bountyType}
          </Badge>
        </div>

        <CardTitle className="text-xl leading-tight group-hover:text-yellow-400 transition-colors">
          {bounty.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 leading-relaxed">{bounty.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">${bounty.rewardAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{bounty._count.submissions} submissions</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(bounty.endsAt)}</span>
            {daysRemaining !== null && daysRemaining <= 7 && (
              <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-400 border-red-500/30">
                {daysRemaining}d left
              </Badge>
            )}
          </div>
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
          >
            <Link href={`/bounties/${bounty.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}