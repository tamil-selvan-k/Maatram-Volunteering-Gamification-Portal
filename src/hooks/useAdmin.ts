import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminStats,
  getAllOpportunities,
  getOpportunityRegistrations,
  updateRegistrationStatus,
  generateActivityReport,
} from '@/services/admin.service'
import type { RegistrationStatus } from '@/types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ADMIN_KEYS = {
  all:            ['admin'] as const,
  stats:          ['admin', 'stats'] as const,
  opportunities:  (page: number) => ['admin', 'opportunities', page] as const,
  registrations:  (opportunityId: string) => ['admin', 'registrations', opportunityId] as const,
  report:         (period: 'month' | 'quarter' | 'all') => ['admin', 'report', period] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn:  () => getAdminStats(),
    select:   (result) => result.data,
    staleTime: 60_000,
  })
}

export function useAdminOpportunities(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ADMIN_KEYS.opportunities(page),
    queryFn:  () => getAllOpportunities(page, pageSize),
    select:   (result) => result.data,
  })
}

export function useOpportunityRegistrations(opportunityId: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.registrations(opportunityId),
    queryFn:  () => getOpportunityRegistrations(opportunityId),
    select:   (result) => result.data ?? [],
    enabled:  !!opportunityId,
  })
}

export function useUpdateRegistrationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      registrationId,
      status,
    }: {
      registrationId: string
      status: 'selected' | 'rejected' | 'attended'
      opportunityId: string
    }) => updateRegistrationStatus(registrationId, status as RegistrationStatus & ('selected' | 'rejected' | 'attended')),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ADMIN_KEYS.registrations(variables.opportunityId),
      })
    },
  })
}

export function useActivityReport(period: 'month' | 'quarter' | 'all', enabled = false) {
  return useQuery({
    queryKey: ADMIN_KEYS.report(period),
    queryFn:  () => generateActivityReport(period),
    select:   (result) => result.data,
    enabled,
    staleTime: 300_000,
  })
}
