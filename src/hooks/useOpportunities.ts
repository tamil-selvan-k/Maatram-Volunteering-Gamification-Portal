import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { showAlert } from '@/lib/alert'
import {
  getOpportunities,
  getOpportunityById,
  registerInterest,
  getMyRegistrations,
  getSelectedCounts,
} from '@/services/opportunity.service'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import type { OpportunityFilters } from '@/types'

export const OPPORTUNITY_KEYS = {
  all:    ['opportunities'] as const,
  list:   (filters?: OpportunityFilters) => ['opportunities', 'list', filters] as const,
  detail: (id: string) => ['opportunities', 'detail', id] as const,
  myRegistrations: (volunteerId: string) => ['my-registrations', volunteerId] as const,
  selectedCounts: (ids: string[]) => ['selected-counts', ids] as const,
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

export function useMyRegistrations() {
  const volunteer = useAuthStore(selectVolunteer)
  return useQuery({
    queryKey: OPPORTUNITY_KEYS.myRegistrations(volunteer?.id ?? ''),
    queryFn: () => getMyRegistrations(volunteer!.id),
    select: (result) => result.data ?? [],
    enabled: !!volunteer,
  })
}

export function useSelectedCounts(opportunityIds: string[]) {
  return useQuery({
    queryKey: OPPORTUNITY_KEYS.selectedCounts(opportunityIds),
    queryFn: () => getSelectedCounts(opportunityIds),
    select: (result) => result.data ?? {},
    enabled: opportunityIds.length > 0,
  })
}

export function useRegisterInterest() {
  const queryClient = useQueryClient()
  const volunteer   = useAuthStore(selectVolunteer)

  return useMutation({
    mutationFn: (opportunityId: string) => {
      if (!volunteer) throw new Error('Please sign in to register for opportunities.')
      return registerInterest(volunteer.id, opportunityId)
    },
    onSuccess: (result) => {
      if (result.error) {
        const msg = result.error.message ?? 'Registration failed.'
        const friendly = msg.includes('duplicate') || msg.includes('23505')
          ? 'You are already registered for this opportunity.'
          : msg
        showAlert('Registration failed', friendly)
        return
      }
      void queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.all })
      if (volunteer) {
        void queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.myRegistrations(volunteer.id) })
      }
      showAlert('Registered!', 'You have successfully registered for this opportunity.')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      showAlert('Registration failed', msg)
    },
  })
}
