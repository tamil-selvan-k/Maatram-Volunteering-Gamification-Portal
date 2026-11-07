import { useQuery } from '@tanstack/react-query'
import { getLeaderboard } from '@/services/volunteer.service'

export const LEADERBOARD_KEYS = {
  all: ['leaderboard'] as const,
}

export function useLeaderboard() {
  return useQuery({
    queryKey: LEADERBOARD_KEYS.all,
    queryFn:  getLeaderboard,
    select:   (result) => result.data ?? [],
    staleTime: 1000 * 60 * 5, // leaderboard refreshes every 5 min
  })
}
