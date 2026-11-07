import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
} from '@/services/notifications.service'

export const NOTIFICATION_KEYS = {
  all: (id: string) => ['notifications', id] as const,
  unread: (id: string) => ['notifications', id, 'unread'] as const,
}

export function useNotifications(volunteerId: string | undefined) {
  const queryClient = useQueryClient()

  // Realtime subscription
  useEffect(() => {
    if (!volunteerId) return

    const channel = supabase
      .channel(`notifications:${volunteerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `volunteer_id=eq.${volunteerId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all(volunteerId) })
          void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread(volunteerId) })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [volunteerId, queryClient])

  return useQuery({
    queryKey: NOTIFICATION_KEYS.all(volunteerId ?? ''),
    queryFn: () => getNotifications(volunteerId!),
    select: (result) => result.data ?? [],
    enabled: !!volunteerId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useUnreadCount(volunteerId: string | undefined) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unread(volunteerId ?? ''),
    queryFn: () => getUnreadCount(volunteerId!),
    select: (result) => result.data ?? 0,
    enabled: !!volunteerId,
    staleTime: 1000 * 30,
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ notificationId }: { notificationId: string; volunteerId: string }) =>
      markNotificationRead(notificationId),
    onSuccess: (_data, { volunteerId }) => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all(volunteerId) })
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread(volunteerId) })
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (volunteerId: string) => markAllRead(volunteerId),
    onSuccess: (_data, volunteerId) => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all(volunteerId) })
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unread(volunteerId) })
    },
  })
}
