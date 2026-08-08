"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { STORAGE_KEYS } from "@/lib/constants"
import type { AuthSession, User } from "@/types"

interface AuthState {
  session: AuthSession | null
  phone: string | null
  setSession: (session: AuthSession, phone: string) => void
  updateUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      phone: null,
      setSession: (session, phone) => set({ session, phone }),
      updateUser: (user) =>
        set((state) =>
          state.session
            ? { session: { ...state.session, user } }
            : state,
        ),
      logout: () => set({ session: null, phone: null }),
    }),
    {
      name: STORAGE_KEYS.auth,
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => window.localStorage)
          : undefined,
      partialize: (state) => ({
        session: state.session,
        phone: state.phone,
      }),
    },
  ),
)

export function useCurrentUser(): User | null {
  return useAuthStore((state) => state.session?.user ?? null)
}
