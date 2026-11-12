import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { getLevelInfo } from '@/utils'
import type { Volunteer } from '@/types'

interface AuthState {
  volunteer: Volunteer | null
  /**
   * The raw Supabase session. Set as soon as getSession() resolves, before the
   * volunteer row is fetched. The redirect-to-login gate uses this, not `volunteer`,
   * so a DB failure fetching the volunteer row never kicks the user out.
   */
  session: Session | null
  isLoading: boolean
  setVolunteer: (v: Volunteer | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
  /** internal: previous level, used to detect level-up */
  _prevLevel: number
}

export const useAuthStore = create<AuthState>((set, get) => ({
  volunteer: null,
  session: null,
  isLoading: true,
  _prevLevel: 1,
  setVolunteer: (volunteer) => {
    const prevLevel = get()._prevLevel
    const wasLoaded = get().volunteer !== null   // true only on subsequent updates
    const newLevel = volunteer ? getLevelInfo(volunteer.total_points).level : 1

    set({ volunteer, _prevLevel: newLevel })

    // Detect level-up: only fire when the volunteer was already loaded (not initial load).
    // Using `wasLoaded` instead of `prevLevel !== 1` so that genuine 1 → 2 transitions
    // are not silently dropped.
    if (volunteer && newLevel > prevLevel && wasLoaded) {
      // Dynamic import to avoid the circular dep between auth.store ↔ ui.store
      import('@/stores/ui.store').then(({ useUIStore }) => {
        const levelName = getLevelInfo(volunteer.total_points).name
        useUIStore.getState().showLevelUp(levelName, newLevel)
      }).catch(() => { /* ignore */ })
    }
  },
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ volunteer: null, session: null, isLoading: false, _prevLevel: 1 }),
}))

// Selectors — use these to avoid unnecessary re-renders
export const selectVolunteer    = (s: AuthState) => s.volunteer
export const selectIsAdmin      = (s: AuthState) => s.volunteer?.is_admin ?? false
export const selectTotalPoints  = (s: AuthState) => s.volunteer?.total_points ?? 0
