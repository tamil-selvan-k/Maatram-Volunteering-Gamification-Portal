import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOpportunities, getOpportunityById, registerInterest } from '@/services/opportunity.service'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import type { OpportunityFilters } from '@/types'

export const OPPORTUNITY_KEYS = {
  all:    ['opportunities'] as const,
  list:   (filters?: OpportunityFilters) => ['opportunities', 'list', filters] as const,
  detail: (id: string) => ['opportunities', 'detail', id] as const,
}

export function useOpportunities(filters?: OpportunityFilters) {
  return useQuery({
    queryKey: OPPORTUNITY_KEYS.list(filters),
    queryFn:  () => getOpportunities(filters),
    select:   (result) => result.data ?? [],
  })
}

export function useOpportunityById(id: string) {
  return useQuery({
    queryKey: OPPORTUNITY_KEYS.detail(id),
    queryFn:  () => getOpportunityById(id),
    select:   (result) => result.data,
    enabled:  !!id,
  })
}

export function useRegisterInterest() {
  const queryClient = useQueryClient()
  const volunteer   = useAuthStore(selectVolunteer)

  return useMutation({
    mutationFn: (opportunityId: string) => {
      if (!volunteer) throw new Error('Not authenticated')
      return registerInterest(volunteer.id, opportunityId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.all })
    },
  })
}
