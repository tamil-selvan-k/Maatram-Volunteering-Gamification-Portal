import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Result, Notification } from '@/types'

export async function getNotifications(volunteerId: string): Promise<Result<Notification[]>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as Notification[], error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function markNotificationRead(notificationId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function markAllRead(volunteerId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('volunteer_id', volunteerId)
      .eq('read', false)

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getUnreadCount(volunteerId: string): Promise<Result<number>> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('volunteer_id', volunteerId)
      .eq('read', false)

    if (error) return { data: null, error: toAppError(error) }
    return { data: count ?? 0, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
