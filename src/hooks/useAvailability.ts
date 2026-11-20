import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { showAlert } from '@/lib/alert'
import {
  getMyAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from '@/services/availability.service'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import type { VolunteerAvailability } from '@/types'

export const AVAILABILITY_KEYS = {
  all:  ['availability'] as const,
  mine: (volunteerId: string) => ['availability', volunteerId] as const,
}

export function useMyAvailability() {
  const volunteer = useAuthStore(selectVolunteer)
  return useQuery({
    queryKey: AVAILABILITY_KEYS.mine(volunteer?.id ?? ''),
    queryFn: () => getMyAvailability(volunteer!.id),
    select: (result) => result.data ?? [],
    enabled: !!volunteer,
  })
}

export function useCreateAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entry: Omit<VolunteerAvailability, 'id' | 'created_at' | 'updated_at'>) =>
      createAvailability(entry),
    onSuccess: (result) => {
      if (result.error) {
        showAlert('Error', result.error.message ?? 'Could not save availability.')
        return
      }
      void queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      showAlert('Error', msg)
    },
  })
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<VolunteerAvailability> }) =>
      updateAvailability(id, updates),
    onSuccess: (result) => {
      if (result.error) {
        showAlert('Error', result.error.message ?? 'Could not update availability.')
        return
      }
      void queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      showAlert('Error', msg)
    },
  })
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAvailability(id),
    onSuccess: (result) => {
      if (result.error) {
        showAlert('Error', result.error.message ?? 'Could not delete availability.')
        return
      }
      void queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      showAlert('Error', msg)
    },
  })
}
