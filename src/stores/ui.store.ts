import { create } from 'zustand'

interface LevelUpModalState {
  show: boolean
  levelName: string
  levelNumber: number
}

interface UIState {
  activeOpportunityFilter: string
  searchQuery: string
  leaderboardPeriod: 'month' | 'quarter' | 'all'
  levelUpModal: LevelUpModalState
  setOpportunityFilter: (filter: string) => void
  setSearchQuery: (q: string) => void
  setLeaderboardPeriod: (p: 'month' | 'quarter' | 'all') => void
  showLevelUp: (levelName: string, levelNumber: number) => void
  dismissLevelUp: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeOpportunityFilter: 'all',
  searchQuery: '',
  leaderboardPeriod: 'month',
  levelUpModal: { show: false, levelName: '', levelNumber: 1 },
  setOpportunityFilter: (activeOpportunityFilter) => set({ activeOpportunityFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLeaderboardPeriod: (leaderboardPeriod) => set({ leaderboardPeriod }),
  showLevelUp: (levelName, levelNumber) =>
    set({ levelUpModal: { show: true, levelName, levelNumber } }),
  dismissLevelUp: () =>
    set({ levelUpModal: { show: false, levelName: '', levelNumber: 1 } }),
}))
