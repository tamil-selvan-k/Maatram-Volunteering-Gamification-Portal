import { useQuery } from '@tanstack/react-query'
import { getLeaderboard, getVolunteerBadges, getActivityHeatmap } from '@/services/volunteer.service'
import type { LeaderboardPeriod } from '@/services/volunteer.service'

export const LEADERBOARD_KEYS = {
  all: ['leaderboard'] as const,
  byPeriod: (period: LeaderboardPeriod) => ['leaderboard', period] as const,
}

export const VOLUNTEER_KEYS = {
  badges: (id: string) => ['volunteer', id, 'badges'] as const,
  heatmap: (id: string) => ['volunteer', id, 'heatmap'] as const,
}

export function useLeaderboard(period: LeaderboardPeriod = 'all') {
  return useQuery({
    queryKey: LEADERBOARD_KEYS.byPeriod(period),
    queryFn:  () => getLeaderboard(period),
    select:   (result) => result.data ?? [],
    staleTime: 1000 * 60 * 5,
  })
}

export function useBadges(volunteerId: string | undefined) {
  return useQuery({
    queryKey: VOLUNTEER_KEYS.badges(volunteerId ?? ''),
    queryFn:  () => getVolunteerBadges(volunteerId!),
    select:   (result) => result.data ?? [],
    enabled:  !!volunteerId,
    staleTime: 1000 * 60 * 10,
  })
}

export function useActivityHeatmap(volunteerId: string | undefined) {
  return useQuery({
    queryKey: VOLUNTEER_KEYS.heatmap(volunteerId ?? ''),
    queryFn:  () => getActivityHeatmap(volunteerId!),
    select:   (result) => result.data ?? {},
    enabled:  !!volunteerId,
    staleTime: 1000 * 60 * 5,
  })
}
