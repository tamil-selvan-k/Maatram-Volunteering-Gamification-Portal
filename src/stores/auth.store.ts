import { create } from 'zustand'
import type { Volunteer } from '@/types'

interface AuthState {
  volunteer: Volunteer | null
  isLoading: boolean
  setVolunteer: (v: Volunteer | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  volunteer: null,
  isLoading: true,
  setVolunteer: (volunteer) => set({ volunteer }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ volunteer: null, isLoading: false }),
}))

// Selectors — use these to avoid unnecessary re-renders
export const selectVolunteer    = (s: AuthState) => s.volunteer
export const selectIsAdmin      = (s: AuthState) => s.volunteer?.is_admin ?? false
export const selectTotalPoints  = (s: AuthState) => s.volunteer?.total_points ?? 0
