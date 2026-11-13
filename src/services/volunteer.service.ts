import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Volunteer, LeaderboardEntry, Result } from '@/types'

function safeRole(meta: Record<string, unknown>): 'student' | 'alumni' | 'supporter' {
  const r = String(meta['role'] ?? '')
  if (r === 'alumni' || r === 'supporter') return r
  return 'student'
}

/**
 * Creates a volunteer row from Supabase Auth user data.
 * Uses INSERT (never upsert/update) so existing fields like is_admin,
 * total_points, level, etc. are never overwritten on a transient DB error.
 * If the row already exists (23505), retries getVolunteerById — the first
 * fetch was a transient failure, not a truly missing row.
 */
export async function upsertVolunteerFromAuth(
  userId: string,
  email: string,
  metadata: Record<string, unknown>
): Promise<Result<Volunteer>> {
  try {
    const { data, error } = await supabase
      .from('volunteers')
      .insert({
        id: userId,
        email,
        full_name: String(metadata['full_name'] ?? 'Volunteer'),
        phone: metadata['phone'] ? String(metadata['phone']) : null,
        role: safeRole(metadata),
        employer_org: metadata['employer_org'] ? String(metadata['employer_org']) : null,
        preferences: [],
        skills: [],
        consent_push: true,
        consent_email: true,
        consent_linkedin: false,
        reliability_score: 1.0,
        total_points: 0,
        level: 1,
        streak_months: 0,
        consecutive_rejections: 0,
        times_selected: 0,
        times_completed: 0,
        is_active: true,
        do_not_contact: false,
        is_admin: false,
      })
      .select('*')
      .single()

    if (error) {
      // Row already exists — first fetch was a transient error. Retry the read.
      if (error.code === '23505') return getVolunteerById(userId)
      return { data: null, error: toAppError(error) }
    }
    return { data: data as Volunteer, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

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
  full_name?: string
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

export type LeaderboardPeriod = 'month' | 'quarter' | 'all'

export async function getLeaderboard(period: LeaderboardPeriod = 'all'): Promise<Result<LeaderboardEntry[]>> {
  try {
    // All-time uses the pre-computed materialized view (fast)
    if (period === 'all') {
      const { data, error } = await supabase
        .from('leaderboard_mv')
        .select('*')
        .order('rank', { ascending: true })
        .limit(50)
      if (error) return { data: null, error: toAppError(error) }
      return { data: data as LeaderboardEntry[], error: null }
    }

    // Monthly / quarterly: aggregate points_log with a date filter
    const cutoff = new Date()
    if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1)
    else cutoff.setMonth(cutoff.getMonth() - 3)

    const { data: logs, error: logErr } = await supabase
      .from('points_log')
      .select('volunteer_id, points')
      .gte('created_at', cutoff.toISOString())

    if (logErr) return { data: null, error: toAppError(logErr) }

    // Aggregate points per volunteer
    const pointsMap = new Map<string, number>()
    for (const row of logs) {
      pointsMap.set(row.volunteer_id, (pointsMap.get(row.volunteer_id) ?? 0) + row.points)
    }
    const topIds = Array.from(pointsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([id]) => id)

    if (topIds.length === 0) return { data: [], error: null }

    const { data: vols, error: volErr } = await supabase
      .from('volunteers')
      .select('id, full_name, role, employer_org, level, streak_months')
      .in('id', topIds)

    if (volErr) return { data: null, error: toAppError(volErr) }

    const sorted: LeaderboardEntry[] = topIds
      .map((vid, i) => {
        const vol = (vols as Array<{ id: string; full_name: string; role: string; employer_org: string | null; level: number; streak_months: number }>).find((v) => v.id === vid)
        if (!vol) return null
        return {
          id: vol.id,
          full_name: vol.full_name,
          role: vol.role as LeaderboardEntry['role'],
          employer_org: vol.employer_org,
          total_points: pointsMap.get(vid) ?? 0,
          level: vol.level,
          streak_months: vol.streak_months,
          total_events: 0,
          total_hours: 0,
          rank: i + 1,
        } satisfies LeaderboardEntry
      })
      .filter((e): e is LeaderboardEntry => e !== null)

    return { data: sorted, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getVolunteerBadges(volunteerId: string): Promise<Result<string[]>> {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('badge_type')
      .eq('volunteer_id', volunteerId)
      .order('earned_at', { ascending: true })

    if (error) return { data: null, error: toAppError(error) }
    return { data: (data as Array<{ badge_type: string }>).map(b => b.badge_type), error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getActivityHeatmap(volunteerId: string): Promise<Result<Record<string, number>>> {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 84) // 12 weeks

    const { data, error } = await supabase
      .from('points_log')
      .select('created_at, points')
      .eq('volunteer_id', volunteerId)
      .gte('created_at', cutoff.toISOString())

    if (error) return { data: null, error: toAppError(error) }

    const heatmap: Record<string, number> = {}
    for (const row of data as Array<{ created_at: string; points: number }>) {
      const day = row.created_at.slice(0, 10) // YYYY-MM-DD
      heatmap[day] = (heatmap[day] ?? 0) + row.points
    }
    return { data: heatmap, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export interface VolunteerStats {
  totalEvents: number
  totalHours: number
  totalPoints: number
  level: number
}

export async function getVolunteerStats(volunteerId: string): Promise<Result<VolunteerStats>> {
  try {
    // Completed verifications (checkout done, hours recorded)
    const { data: verifications, error: verErr } = await supabase
      .from('verifications')
      .select('verified_hours, registration_id')
      .not('verified_hours', 'is', null)

    if (verErr) return { data: null, error: toAppError(verErr) }

    // We need registrations to filter by volunteer
    const registrationIds = (verifications as Array<{ verified_hours: number; registration_id: string }>)
      .map((v) => v.registration_id)

    if (registrationIds.length === 0) {
      const volRes = await supabase
        .from('volunteers')
        .select('total_points, level')
        .eq('id', volunteerId)
        .single()
      if (volRes.error) return { data: null, error: toAppError(volRes.error) }
      const v = volRes.data as { total_points: number; level: number }
      return { data: { totalEvents: 0, totalHours: 0, totalPoints: v.total_points, level: v.level }, error: null }
    }

    const { data: regs, error: regErr } = await supabase
      .from('registrations')
      .select('id')
      .eq('volunteer_id', volunteerId)
      .in('id', registrationIds)

    if (regErr) return { data: null, error: toAppError(regErr) }

    const myRegIds = new Set((regs as Array<{ id: string }>).map((r) => r.id))
    const myVerifications = (verifications as Array<{ verified_hours: number; registration_id: string }>)
      .filter((v) => myRegIds.has(v.registration_id))

    const totalHours = myVerifications.reduce((sum, v) => sum + (v.verified_hours ?? 0), 0)
    const totalEvents = myVerifications.length

    const { data: vol, error: volErr2 } = await supabase
      .from('volunteers')
      .select('total_points, level')
      .eq('id', volunteerId)
      .single()

    if (volErr2) return { data: null, error: toAppError(volErr2) }
    const volData = vol as { total_points: number; level: number }

    return {
      data: {
        totalEvents,
        totalHours: Math.round(totalHours * 10) / 10,
        totalPoints: volData.total_points,
        level: volData.level,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
