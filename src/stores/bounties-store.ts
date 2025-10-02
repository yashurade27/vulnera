import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Bounty {
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

interface BountyDetails extends Bounty {
  createdAt: string
  requirements: string | null
  inScope: string | null
  outOfScope: string | null
  guidelines: string | null
  stats?: {
    totalSubmissions: number
    paidSubmissions: number
    pendingSubmissions: number
  }
}

interface Submission {
  id: string
  title: string
  status: string
  createdAt: string
  hunter: {
    name: string
    email: string
  }
}

interface BountiesStore {
  bounties: Bounty[]
  currentBounty: BountyDetails | null
  submissions: Submission[]
  loading: boolean
  setBounties: (bounties: Bounty[]) => void
  setCurrentBounty: (bounty: BountyDetails | null) => void
  setSubmissions: (submissions: Submission[]) => void
  setLoading: (loading: boolean) => void
  addSubmission: (submission: Submission) => void
  updateSubmission: (id: string, updates: Partial<Submission>) => void
  clearSubmissions: () => void
}

export const useBountiesStore = create<BountiesStore>()(
  persist(
    (set, get) => ({
      bounties: [],
      currentBounty: null,
      submissions: [],
      loading: false,
      setBounties: (bounties) => set({ bounties }),
      setCurrentBounty: (bounty) => set({ currentBounty: bounty }),
      setSubmissions: (submissions) => set({ submissions }),
      setLoading: (loading) => set({ loading }),
      addSubmission: (submission) =>
        set((state) => ({ submissions: [...state.submissions, submission] })),
      updateSubmission: (id, updates) =>
        set((state) => ({
          submissions: state.submissions.map((sub) =>
            sub.id === id ? { ...sub, ...updates } : sub
          ),
        })),
      clearSubmissions: () => set({ submissions: [] }),
    }),
    {
      name: "vulnera-bounties",
      partialize: (state) => ({
        bounties: state.bounties,
        currentBounty: state.currentBounty,
      }),
    }
  )
)