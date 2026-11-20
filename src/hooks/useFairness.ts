import { useQuery } from '@tanstack/react-query'
import {
  getFairnessOverview,
  getOpportunityMetrics,
  getVolunteerDistribution,
  type FairnessFilters,
} from '@/services/fairness.service'

export const FAIRNESS_KEYS = {
  overview: (filters: FairnessFilters) => ['fairness', 'overview', filters] as const,
  opportunities: (filters: FairnessFilters) => ['fairness', 'opportunities', filters] as const,
  distribution: (filters: FairnessFilters) => ['fairness', 'distribution', filters] as const,
}

export function useFairnessOverview(filters: FairnessFilters) {
  return useQuery({
    queryKey: FAIRNESS_KEYS.overview(filters),
    queryFn: () => getFairnessOverview(filters),
    select: (result) => result.data,
    staleTime: 120_000,
  })
}

export function useOpportunityMetrics(filters: FairnessFilters) {
  return useQuery({
    queryKey: FAIRNESS_KEYS.opportunities(filters),
    queryFn: () => getOpportunityMetrics(filters),
    select: (result) => result.data ?? [],
    staleTime: 120_000,
  })
}

export function useVolunteerDistribution(filters: FairnessFilters) {
  return useQuery({
    queryKey: FAIRNESS_KEYS.distribution(filters),
    queryFn: () => getVolunteerDistribution(filters),
    select: (result) => result.data ?? [],
    staleTime: 120_000,
  })
}
