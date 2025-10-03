import { useEffect, useState } from "react"
import { create } from "zustand"
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware"
import type { RegisterInput } from "@/lib/types"

type PendingVerification = {
  email: string
  username?: string
  role?: RegisterInput["role"]
  createdAt: number
}

export type AuthFlowStore = {
  pendingVerification: PendingVerification | null
  resendCooldownEndsAt: number | null
  setPendingVerification: (payload: PendingVerification) => void
  clearPendingVerification: () => void
  startResendCooldown: (cooldownSeconds: number) => void
  clearResendCooldown: () => void
}

type PersistedAuthFlowState = Pick<AuthFlowStore, "pendingVerification" | "resendCooldownEndsAt">

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => void 0,
  removeItem: () => void 0,
}

const storage = createJSONStorage<PersistedAuthFlowState>(() => {
  if (typeof window === "undefined") {
    return noopStorage
  }
  return sessionStorage
})

export const useAuthFlowStore = create<AuthFlowStore>()(
  persist(
    (set) => ({
      pendingVerification: null,
      resendCooldownEndsAt: null,
      setPendingVerification: (payload) => set({ pendingVerification: payload }),
      clearPendingVerification: () => set({ pendingVerification: null }),
      startResendCooldown: (seconds) => set({ resendCooldownEndsAt: Date.now() + seconds * 1000 }),
      clearResendCooldown: () => set({ resendCooldownEndsAt: null }),
    }),
    {
      name: "vulnera-auth-flow",
      storage,
      partialize: (state): PersistedAuthFlowState => ({
        pendingVerification: state.pendingVerification,
        resendCooldownEndsAt: state.resendCooldownEndsAt,
      }),
    },
  ),
)

export const useAuthFlowHydration = () => {
  const [hydrated, setHydrated] = useState(() => useAuthFlowStore.persist.hasHydrated())

  useEffect(() => {
    const unsubHydrate = useAuthFlowStore.persist.onHydrate(() => setHydrated(false))
    const unsubFinish = useAuthFlowStore.persist.onFinishHydration(() => setHydrated(true))

    return () => {
      unsubHydrate?.()
      unsubFinish?.()
    }
  }, [])

  return hydrated
}
