"use client"

import { useCallback, useEffect, useState } from "react"
import { Search, Filter, TrendingUp, Clock, DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BountyCard } from "@/components/bounty-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useBountiesStore } from "@/stores/bounties-store"

const BOUNTY_TYPES = [
  { value: "UI", label: "UI" },
  { value: "FUNCTIONALITY", label: "Functionality" },
  { value: "PERFORMANCE", label: "Performance" },
  { value: "SECURITY", label: "Security" },
]

function BountiesPage() {
  const { bounties, setBounties, loading, setLoading } = useBountiesStore()
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [rewardRange, setRewardRange] = useState([0, 10000])
  // destructure to avoid dynamic array in deps
  const [minReward, maxReward] = rewardRange
  const [sortBy, setSortBy] = useState("createdAt")
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const LIMIT = 20
  const [hasMore, setHasMore] = useState(false)

  const fetchBounties = useCallback(async (offsetParam: number = 0, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: "ACTIVE",
        limit: LIMIT.toString(),
        offset: offsetParam.toString(),
        sortBy,
        sortOrder: sortBy === "rewardAmount" ? "desc" : "desc",
      })

      if (search) params.append("search", search)

      const selectedType = selectedTypes[0]
      if (selectedType) {
        params.append("type", selectedType)
      }

      const [minReward, maxReward] = rewardRange
      if (minReward > 0) params.append("minReward", minReward.toString())
      if (maxReward < 10000) params.append("maxReward", maxReward.toString())

      const response = await fetch(`/api/bounties?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch bounties: ${response.status}`)
      }

      const data = await response.json()

      const items = data.bounties || []
      if (append) {
        setBounties([...bounties, ...items])
      } else {
        setBounties(items)
      }
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      // update offset for next fetch
  // offset state updated by caller
    } catch (error) {
      console.error("Failed to fetch bounties:", error)
      if (!append) {
        setBounties([])
        setTotal(0)
        setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }, [search, selectedTypes, minReward, maxReward, sortBy])

  useEffect(() => {
    // initial load or when any filter dependency changes via fetchBounties
    setOffset(0)
    fetchBounties(0, false)
  }, [fetchBounties])

  const handleLoadMore = () => {
    fetchBounties(offset, true)
    setOffset(prev => prev + LIMIT)
  }

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? [] : [type]))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container-custom py-8">
          <h1 className="text-4xl lg:text-5xl font-medium mb-4">
            Browse <span className="text-yellow-400">Bounties</span>
          </h1>
          <p className="text-muted-foreground text-lg">Discover active bug bounties from verified companies</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className="space-y-6">
            <div className="process-card">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>

              {/* Search */}
              <div className="space-y-2 mb-6">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search bounties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Bounty Type */}
              <div className="space-y-3 mb-6">
                <Label>Bounty Type</Label>
                {BOUNTY_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <Checkbox
                      id={type.value}
                      checked={selectedTypes.includes(type.value)}
                      onCheckedChange={() => handleTypeToggle(type.value)}
                    />
                    <label
                      htmlFor={type.value}
                      className="text-sm cursor-pointer hover:text-foreground transition-colors"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Reward Range */}
              <div className="space-y-3 mb-6">
                <Label>Reward Range</Label>
                <div className="space-y-4">
                  <Slider
                    value={rewardRange}
                    onValueChange={setRewardRange}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>${rewardRange[0]}</span>
                    <span>${rewardRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Newest
                      </div>
                    </SelectItem>
                    <SelectItem value="rewardAmount">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Highest Reward
                      </div>
                    </SelectItem>
                    <SelectItem value="endsAt">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Ending Soon
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 bg-transparent"
                onClick={() => {
                  setSearch("")
                  setSelectedTypes([])
                  setRewardRange([0, 10000])
                  setSortBy("createdAt")
                  setOffset(0)
                  setHasMore(false)
                }}
              >
                Clear Filters
              </Button>
            </div>
          </aside>

          {/* Bounties Grid */}
          <main>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">{loading ? "Loading..." : `${total} bounties found`}</p>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="process-card animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : bounties.length === 0 ? (
              <div className="process-card text-center py-12">
                <p className="text-muted-foreground text-lg">No bounties found matching your criteria</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {bounties.map((bounty) => (
                  <BountyCard key={bounty.id} bounty={bounty} />
                ))}
              </div>
            )}

            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <Button onClick={handleLoadMore} className="btn-primary">
                  Load More Bounties
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return <BountiesPage />
}