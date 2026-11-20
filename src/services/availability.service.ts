import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { VolunteerAvailability, Result } from '@/types'

export async function getMyAvailability(
  volunteerId: string
): Promise<Result<VolunteerAvailability[]>> {
  try {
    const { data, error } = await supabase
      .from('volunteer_availability')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as VolunteerAvailability[], error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function createAvailability(
  entry: Omit<VolunteerAvailability, 'id' | 'created_at' | 'updated_at'>
): Promise<Result<VolunteerAvailability>> {
  try {
    const { data, error } = await supabase
      .from('volunteer_availability')
      .insert(entry)
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as VolunteerAvailability, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function updateAvailability(
  id: string,
  updates: Partial<VolunteerAvailability>
): Promise<Result<VolunteerAvailability>> {
  try {
    const { data, error } = await supabase
      .from('volunteer_availability')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as VolunteerAvailability, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function deleteAvailability(
  id: string
): Promise<Result<{ success: boolean }>> {
  try {
    const { error } = await supabase
      .from('volunteer_availability')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: toAppError(error) }
    return { data: { success: true }, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function checkVolunteerAvailability(
  volunteerId: string,
  eventDate: string,
  durationHours: number,
  mode: 'online' | 'offline'
): Promise<Result<{ available: boolean; reason?: string }>> {
  try {
    const date = new Date(eventDate)
    const dayOfWeek = date.getDay()
    const eventTime = eventDate.slice(11, 16)

    const [hh = '0', mm = '0'] = eventTime.split(':')
    const endMinutes =
      parseInt(hh, 10) * 60 +
      parseInt(mm, 10) +
      durationHours * 60
    const endHour = String(Math.floor(endMinutes / 60)).padStart(2, '0')
    const endMin = String(Math.round(endMinutes % 60)).padStart(2, '0')
    const eventEndTime = `${endHour}:${endMin}`

    const dateStr = eventDate.slice(0, 10)

    const { data: exceptions, error: excErr } = await supabase
      .from('volunteer_availability')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .eq('type', 'exception')
      .eq('specific_date', dateStr)

    if (excErr) return { data: null, error: toAppError(excErr) }

    const exceptionSlots = (exceptions ?? []) as VolunteerAvailability[]
    if (exceptionSlots.length > 0) {
      const unavailable = exceptionSlots.find((s) => s.status === 'unavailable')
      if (unavailable) {
        return { data: { available: false, reason: 'Marked unavailable on this date' }, error: null }
      }

      const covering = exceptionSlots.find(
        (s) =>
          s.status !== 'unavailable' &&
          s.start_time <= eventTime &&
          s.end_time >= eventEndTime &&
          (s.mode_preference === 'any' || s.mode_preference === mode)
      )
      if (covering) {
        return { data: { available: true }, error: null }
      }

      return {
        data: { available: false, reason: 'Exception slots do not cover this event' },
        error: null,
      }
    }

    const { data: recurring, error: recErr } = await supabase
      .from('volunteer_availability')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .eq('type', 'recurring')
      .eq('day_of_week', dayOfWeek)

    if (recErr) return { data: null, error: toAppError(recErr) }

    const recurringSlots = (recurring ?? []) as VolunteerAvailability[]
    if (recurringSlots.length === 0) {
      return { data: { available: false, reason: 'No availability set for this day' }, error: null }
    }

    const covering = recurringSlots.find(
      (s) =>
        s.status !== 'unavailable' &&
        s.start_time <= eventTime &&
        s.end_time >= eventEndTime &&
        (s.mode_preference === 'any' || s.mode_preference === mode)
    )

    if (!covering) {
      return {
        data: { available: false, reason: 'No matching time slot or mode' },
        error: null,
      }
    }

    return { data: { available: true }, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
