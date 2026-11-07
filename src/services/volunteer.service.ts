import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Volunteer, LeaderboardEntry, Result } from '@/types'

export async function getVolunteerById(id: string): Promise<Result<Volunteer>> {
  try {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as Volunteer, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export interface VolunteerProfileUpdates {
  preferences?: string[]
  skills?: string[]
  consent_push?: boolean
  consent_email?: boolean
  consent_linkedin?: boolean
  employer_org?: string | null
  phone?: string | null
}

export async function updateVolunteerProfile(
  id: string,
  updates: VolunteerProfileUpdates
): Promise<Result<Volunteer>> {
  try {
    const { data, error } = await supabase
      .from('volunteers')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as Volunteer, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getLeaderboard(): Promise<Result<LeaderboardEntry[]>> {
  try {
    const { data, error } = await supabase
      .from('leaderboard_mv')
      .select('*')
      .order('rank', { ascending: true })
      .limit(50)

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as LeaderboardEntry[], error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
