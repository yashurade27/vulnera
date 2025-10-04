"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Trophy, TrendingUp, Medal, Award, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 9,
})

const timeframeOptions: Array<{ value: LeaderboardTimeframe; label: string; helper: string }> = [
  { value: "all", label: "All-time", helper: "Lifetime earnings" },
  { value: "month", label: "Monthly", helper: "Last 30 days" },
  { value: "week", label: "Weekly", helper: "Last 7 days" },
]

type LeaderboardTimeframe = "all" | "month" | "week"

interface LeaderboardEntry {
  id: string
  username: string
  fullName: string | null
  avatarUrl: string | null
  country: string | null
  totalEarnings: number
  totalBounties: number
  reputation: number
  rank: number | null
  createdAt: string
}

export function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    let cancelled = false

    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }
        const data = await response.json();

        if (!cancelled) {
          setEntries(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err instanceof Error ? err.message : "Unexpected error loading leaderboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      cancelled = true
    }
  }, [timeframe])

  const topThree = useMemo(() => entries.slice(0, 3), [entries])
  const rest = useMemo(() => entries.slice(3), [entries])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-12 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-semibold flex items-center gap-3">
                <Trophy className="w-10 h-10 text-yellow-400" /> Vulnera Leaderboard
              </h1>
              <p className="text-muted-foreground text-lg">Recognizing the top bounty hunters in the community</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {timeframeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timeframe === option.value ? "default" : "ghost"}
                  className={timeframe === option.value ? "bg-yellow-400 text-slate-900" : ""}
                  onClick={() => setTimeframe(option.value)}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.helper}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-10 space-y-10">
        {loading ? (
          <div className="space-y-6">
            <Card className="card-glass">
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="card-glass">
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <Card className="card-glass border border-red-500/40 max-w-xl mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <TrendingUp className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => setTimeframe(timeframe)}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card className="card-glass max-w-xl mx-auto text-center">
            <CardContent className="p-10 space-y-4">
              <Medal className="w-12 h-12 text-yellow-300 mx-auto" />
              <p className="text-muted-foreground">Leaderboard is empty. Be the first to submit a bounty!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            <section className="grid gap-6 lg:grid-cols-3">
              {topThree.map((entry, index) => (
                <Card key={entry.id} className="card-glass border-yellow-500/30 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500" />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <span className="text-3xl font-bold text-yellow-300">#{index + 1}</span>
                      {entry.fullName ?? `@${entry.username}`}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Joined {new Date(entry.createdAt).getFullYear()}</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border border-yellow-400/40">
                        {entry.avatarUrl ? (
                          <AvatarImage src={entry.avatarUrl} alt={entry.fullName ?? entry.username} />
                        ) : null}
                        <AvatarFallback className="bg-yellow-500/10 text-yellow-200 text-xl font-semibold">
                          {(entry.fullName ?? entry.username ?? "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-muted-foreground">Total earnings</p>
                        <p className="text-2xl font-semibold text-yellow-300">
                          {currencyFormatter.format(entry.totalEarnings)} SOL
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-muted-foreground text-xs">Completed Bounties</p>
                        <p className="text-lg font-semibold">{entry.totalBounties}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border">
                        <p className="text-muted-foreground text-xs">Reputation</p>
                        <p className="text-lg font-semibold">{entry.reputation}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-yellow-500/30">
                        <Award className="w-3 h-3 mr-1" /> Elite Hunter
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/profile/${entry.id}`} className="flex items-center gap-1 text-xs">
                          View profile <ChevronRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            {rest.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Medal className="w-5 h-5 text-yellow-300" />
                  <h2 className="text-2xl font-semibold">Leaderboard</h2>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="grid grid-cols-[40px_1fr_1fr_1fr_120px] bg-card/70 text-xs uppercase tracking-wide text-muted-foreground px-6 py-3">
                    <span>#</span>
                    <span>Hunter</span>
                    <span>Rewards</span>
                    <span>Bounties</span>
                    <span>Reputation</span>
                    <span className="text-right">Profile</span>
                  </div>
                  {rest.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[40px_1fr_1fr_1fr_120px] items-center px-6 py-4 border-t border-border/60 text-sm hover:bg-white/5 transition"
                    >
                      <span className="font-semibold text-muted-foreground">#{index + 4}</span>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {entry.avatarUrl ? (
                            <AvatarImage src={entry.avatarUrl} alt={entry.fullName ?? entry.username} />
                          ) : null}
                          <AvatarFallback className="bg-muted text-xs font-semibold">
                            {(entry.fullName ?? entry.username ?? "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold leading-tight">{entry.fullName ?? `@${entry.username}`}</p>
                          <p className="text-xs text-muted-foreground">@{entry.username}</p>
                        </div>
                      </div>
                      <span>{currencyFormatter.format(entry.totalEarnings)} SOL</span>
                      <span>{entry.totalBounties}</span>
                      <span>{entry.reputation}</span>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/profile/${entry.id}`} className="text-xs flex items-center gap-1">
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
