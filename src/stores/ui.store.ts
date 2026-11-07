import { create } from 'zustand'

interface UIState {
  activeOpportunityFilter: string
  searchQuery: string
  leaderboardPeriod: 'month' | 'quarter' | 'all'
  setOpportunityFilter: (filter: string) => void
  setSearchQuery: (q: string) => void
  setLeaderboardPeriod: (p: 'month' | 'quarter' | 'all') => void
}

export const useUIStore = create<UIState>((set) => ({
  activeOpportunityFilter: 'all',
  searchQuery: '',
  leaderboardPeriod: 'month',
  setOpportunityFilter: (activeOpportunityFilter) => set({ activeOpportunityFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLeaderboardPeriod: (leaderboardPeriod) => set({ leaderboardPeriod }),
}))
