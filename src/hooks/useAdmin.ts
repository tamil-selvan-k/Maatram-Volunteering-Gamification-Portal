import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminStats,
  getAllOpportunities,
  getOpportunityRegistrations,
  updateRegistrationStatus,
  generateActivityReport,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  runAllocation,
  getVolunteers,
  updateVolunteerAdmin,
  getActivityTypes,
  createActivityType,
  deleteActivityType,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from '@/services/admin.service'
import { getOpportunityById } from '@/services/opportunity.service'
import type { RegistrationStatus } from '@/types'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ADMIN_KEYS = {
  all:              ['admin'] as const,
  stats:            ['admin', 'stats'] as const,
  opportunities:    (page: number) => ['admin', 'opportunities', page] as const,
  opportunityById:  (id: string) => ['admin', 'opportunity', id] as const,
  registrations:    (opportunityId: string) => ['admin', 'registrations', opportunityId] as const,
  report:           (period: 'month' | 'quarter' | 'all') => ['admin', 'report', period] as const,
  verifications:    (opportunityId?: string) =>
    ['admin', 'verifications', 'pending', opportunityId ?? 'all'] as const,
  volunteers:       (page: number, search?: string) =>
    ['admin', 'volunteers', page, search ?? ''] as const,
  activityTypes:    ['admin', 'activity-types'] as const,
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
      status: RegistrationStatus
      opportunityId: string
    }) => updateRegistrationStatus(registrationId, status),
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

export function useAdminOpportunity(id: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.opportunityById(id),
    queryFn:  () => getOpportunityById(id),
    select:   (result) => result.data,
    enabled:  !!id,
  })
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateOpportunityInput) => {
      const result = await createOpportunity(input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateOpportunityInput }) => {
      const result = await updateOpportunity(id, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.opportunityById(variables.id) })
    },
  })
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteOpportunity(id)
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

// ─── Verification review ──────────────────────────────────────────────────────

export function usePendingVerifications(opportunityId?: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.verifications(opportunityId),
    queryFn:  () => getPendingVerifications(opportunityId),
    select:   (result) => result.data ?? [],
  })
}

export function useApproveVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await approveVerification(id)
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] })
    },
  })
}

export function useRejectVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await rejectVerification(id)
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] })
    },
  })
}

// ─── Run allocation ───────────────────────────────────────────────────────────

export function useRunAllocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (opportunityId: string) => {
      const result = await runAllocation(opportunityId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_data, opportunityId) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.registrations(opportunityId) })
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.all })
    },
  })
}

// ─── Volunteer management ─────────────────────────────────────────────────────

export function useVolunteers(page = 1, search?: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.volunteers(page, search),
    queryFn:  () => getVolunteers(page, search),
    select:   (result) => result.data,
  })
}

export function useUpdateVolunteerAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: { is_admin?: boolean; do_not_contact?: boolean; is_active?: boolean }
    }) => {
      const result = await updateVolunteerAdmin(id, updates)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'volunteers'] })
    },
  })
}

// ─── Activity types ───────────────────────────────────────────────────────────

export function useActivityTypes() {
  return useQuery({
    queryKey: ADMIN_KEYS.activityTypes,
    queryFn:  () => getActivityTypes(),
    select:   (result) => result.data ?? [],
    staleTime: 300_000,
  })
}

export function useCreateActivityType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      key,
      label,
      accent,
    }: {
      key: string
      label: string
      accent: string
    }) => {
      const result = await createActivityType(key, label, accent)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.activityTypes })
    },
  })
}

export function useDeleteActivityType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteActivityType(id)
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.activityTypes })
    },
  })
}
