import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Bounty {
  id: string
  title: string
  description: string
  bountyTypes: string[]
  rewardAmount: number
  status: string
  endsAt: string | null
  escrowAddress: string | null
  escrowBalanceLamports: number | null
  txSignature: string | null
  company: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    isVerified: boolean
    walletAddress?: string | null
  }
  _count: {
    submissions: number
  }
}

interface BountyDetails extends Bounty {
  maxSubmissions: number | null | undefined
  createdAt: string
  requirements: string | null
  inScope: string | null
  outOfScope: string | null
  guidelines: string | null
  escrowAddress: string | null
  escrowBalanceLamports: number | null
  txSignature: string | null
  stats?: {
    totalSubmissions: number
    paidSubmissions: number
    pendingSubmissions: number
  }
}

interface SubmissionReporter {
  displayName: string
  username?: string | null
}

interface Submission {
  id: string
  title: string
  status: string
  createdAt: string
  reporter: SubmissionReporter
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
