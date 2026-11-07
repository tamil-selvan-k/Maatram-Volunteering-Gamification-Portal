import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Result, PaginatedResult, Opportunity, RegistrationStatus } from '@/types'

// ─── Stat types ───────────────────────────────────────────────────────────────

export interface AdminStats {
  totalVolunteers: number
  eventsCompletedThisMonth: number
  pointsAwardedThisMonth: number
  avgReliabilityScore: number
}

// ─── Opportunity row with registration counts ─────────────────────────────────

export interface AdminOpportunityRow {
  id: string
  title: string
  event_date: string
  activity_type: string
  status: string
  registrations_count: number
  verified_count: number
}

// ─── Registration row with volunteer info ─────────────────────────────────────

export interface AdminRegistrationRow {
  id: string
  volunteer_id: string
  volunteer_name: string
  volunteer_email: string
  status: RegistrationStatus
  registered_at: string
  verification_level: string | null
}

// ─── Activity report ──────────────────────────────────────────────────────────

export interface VolunteerActivitySummary {
  volunteer_id: string
  volunteer_name: string
  volunteer_email: string
  events_completed: number
  hours_volunteered: number
  points_earned: number
  badges_earned: string[]
}

export interface ActivityReport {
  period: 'month' | 'quarter' | 'all'
  generated_at: string
  volunteers: VolunteerActivitySummary[]
}

// ─── Functions ────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<Result<AdminStats>> {
  try {
    // Total volunteers
    const { count: totalVolunteers, error: volErr } = await supabase
      .from('volunteers')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (volErr) return { data: null, error: toAppError(volErr) }

    // Monthly cutoff
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Events completed this month (opportunities that transitioned to completed this month)
    const { count: eventsCount, error: evErr } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('event_date', monthStart.toISOString())

    if (evErr) return { data: null, error: toAppError(evErr) }

    // Points awarded this month
    const { data: pointsData, error: ptErr } = await supabase
      .from('points_log')
      .select('points')
      .gte('created_at', monthStart.toISOString())

    if (ptErr) return { data: null, error: toAppError(ptErr) }

    const pointsThisMonth = (pointsData as Array<{ points: number }>).reduce(
      (sum, row) => sum + row.points,
      0
    )

    // Average reliability score
    const { data: reliabilityData, error: relErr } = await supabase
      .from('volunteers')
      .select('reliability_score')
      .eq('is_active', true)

    if (relErr) return { data: null, error: toAppError(relErr) }

    const scores = (reliabilityData as Array<{ reliability_score: number }>).map(
      (r) => r.reliability_score
    )
    const avgReliability =
      scores.length > 0
        ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100
        : 0

    return {
      data: {
        totalVolunteers: totalVolunteers ?? 0,
        eventsCompletedThisMonth: eventsCount ?? 0,
        pointsAwardedThisMonth: pointsThisMonth,
        avgReliabilityScore: avgReliability,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getAllOpportunities(
  page = 1,
  pageSize = 20
): Promise<Result<PaginatedResult<AdminOpportunityRow>>> {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('opportunities')
      .select('id, title, event_date, activity_type, status', { count: 'exact' })
      .order('event_date', { ascending: false })
      .range(from, to)

    if (error) return { data: null, error: toAppError(error) }

    const opportunities = data as Array<{
      id: string
      title: string
      event_date: string
      activity_type: string
      status: string
    }>

    // Get registration counts for all fetched opportunities
    const ids = opportunities.map((o) => o.id)
    const rows: AdminOpportunityRow[] = await Promise.all(
      ids.map(async (id) => {
        const opp = opportunities.find((o) => o.id === id)!

        const { data: regRows, count: regCount } = await supabase
          .from('registrations')
          .select('id', { count: 'exact' })
          .eq('opportunity_id', id)

        const regIdList = ((regRows ?? []) as Array<{ id: string }>).map((r) => r.id)
        const { count: verCount } = regIdList.length > 0
          ? await supabase
              .from('verifications')
              .select('id', { count: 'exact', head: true })
              .in('registration_id', regIdList)
              .not('checkout_time', 'is', null)
          : { count: 0 as number | null }

        return {
          id: opp.id,
          title: opp.title,
          event_date: opp.event_date,
          activity_type: opp.activity_type,
          status: opp.status,
          registrations_count: regCount ?? 0,
          verified_count: verCount ?? 0,
        }
      })
    )

    return {
      data: {
        items: rows,
        total: count ?? 0,
        page,
        pageSize,
        hasMore: (count ?? 0) > to + 1,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getOpportunityRegistrations(
  opportunityId: string
): Promise<Result<AdminRegistrationRow[]>> {
  try {
    const { data: regs, error: regErr } = await supabase
      .from('registrations')
      .select('id, volunteer_id, status, registered_at')
      .eq('opportunity_id', opportunityId)
      .order('registered_at', { ascending: true })

    if (regErr) return { data: null, error: toAppError(regErr) }

    const registrations = regs as Array<{
      id: string
      volunteer_id: string
      status: RegistrationStatus
      registered_at: string
    }>

    if (registrations.length === 0) return { data: [], error: null }

    const volunteerIds = registrations.map((r) => r.volunteer_id)

    const { data: volunteers, error: volErr } = await supabase
      .from('volunteers')
      .select('id, full_name, email')
      .in('id', volunteerIds)

    if (volErr) return { data: null, error: toAppError(volErr) }

    const volMap = new Map(
      (volunteers as Array<{ id: string; full_name: string; email: string }>).map((v) => [
        v.id,
        v,
      ])
    )

    // Get verification levels
    const regIds = registrations.map((r) => r.id)
    const { data: verifications } = await supabase
      .from('verifications')
      .select('registration_id, verification_level')
      .in('registration_id', regIds)

    const verMap = new Map(
      ((verifications ?? []) as Array<{
        registration_id: string
        verification_level: string
      }>).map((v) => [v.registration_id, v.verification_level])
    )

    const rows: AdminRegistrationRow[] = registrations.map((reg) => {
      const vol = volMap.get(reg.volunteer_id)
      return {
        id: reg.id,
        volunteer_id: reg.volunteer_id,
        volunteer_name: vol?.full_name ?? 'Unknown',
        volunteer_email: vol?.email ?? '',
        status: reg.status,
        registered_at: reg.registered_at,
        verification_level: verMap.get(reg.id) ?? null,
      }
    })

    return { data: rows, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', registrationId)

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function generateActivityReport(
  period: 'month' | 'quarter' | 'all'
): Promise<Result<ActivityReport>> {
  try {
    const cutoff = new Date()
    if (period === 'month') {
      cutoff.setMonth(cutoff.getMonth() - 1)
    } else if (period === 'quarter') {
      cutoff.setMonth(cutoff.getMonth() - 3)
    } else {
      cutoff.setFullYear(2000, 0, 1) // effectively "all"
    }

    // Get all completed verifications in the period
    const { data: verifications, error: verErr } = await supabase
      .from('verifications')
      .select('registration_id, verified_hours, points_awarded')
      .not('checkout_time', 'is', null)
      .gte('created_at', cutoff.toISOString())

    if (verErr) return { data: null, error: toAppError(verErr) }

    if ((verifications as unknown[]).length === 0) {
      return {
        data: { period, generated_at: new Date().toISOString(), volunteers: [] },
        error: null,
      }
    }

    const regIds = (verifications as Array<{ registration_id: string }>).map(
      (v) => v.registration_id
    )

    // Get registrations to map to volunteers
    const { data: registrations, error: regErr } = await supabase
      .from('registrations')
      .select('id, volunteer_id')
      .in('id', regIds)

    if (regErr) return { data: null, error: toAppError(regErr) }

    // Build volunteer → verifications map
    const regToVol = new Map(
      (registrations as Array<{ id: string; volunteer_id: string }>).map((r) => [
        r.id,
        r.volunteer_id,
      ])
    )

    type VerRow = { registration_id: string; verified_hours: number | null; points_awarded: number | null }
    const volunteerVerMap = new Map<
      string,
      { events: number; hours: number; points: number }
    >()

    for (const ver of verifications as VerRow[]) {
      const volId = regToVol.get(ver.registration_id)
      if (!volId) continue
      const existing = volunteerVerMap.get(volId) ?? { events: 0, hours: 0, points: 0 }
      volunteerVerMap.set(volId, {
        events: existing.events + 1,
        hours: existing.hours + (ver.verified_hours ?? 0),
        points: existing.points + (ver.points_awarded ?? 0),
      })
    }

    const volunteerIds = Array.from(volunteerVerMap.keys())

    if (volunteerIds.length === 0) {
      return {
        data: { period, generated_at: new Date().toISOString(), volunteers: [] },
        error: null,
      }
    }

    // Get volunteer profiles
    const { data: volunteers, error: volErr } = await supabase
      .from('volunteers')
      .select('id, full_name, email')
      .in('id', volunteerIds)

    if (volErr) return { data: null, error: toAppError(volErr) }

    // Get badges earned in period
    const { data: badges } = await supabase
      .from('badges')
      .select('volunteer_id, badge_type')
      .in('volunteer_id', volunteerIds)
      .gte('earned_at', cutoff.toISOString())

    const badgesMap = new Map<string, string[]>()
    for (const badge of (badges ?? []) as Array<{ volunteer_id: string; badge_type: string }>) {
      const existing = badgesMap.get(badge.volunteer_id) ?? []
      badgesMap.set(badge.volunteer_id, [...existing, badge.badge_type])
    }

    const summaries: VolunteerActivitySummary[] = (
      volunteers as Array<{ id: string; full_name: string; email: string }>
    ).map((vol) => {
      const stats = volunteerVerMap.get(vol.id) ?? { events: 0, hours: 0, points: 0 }
      return {
        volunteer_id: vol.id,
        volunteer_name: vol.full_name,
        volunteer_email: vol.email,
        events_completed: stats.events,
        hours_volunteered: Math.round(stats.hours * 10) / 10,
        points_earned: stats.points,
        badges_earned: badgesMap.get(vol.id) ?? [],
      }
    })

    // Sort by points descending
    summaries.sort((a, b) => b.points_earned - a.points_earned)

    return {
      data: {
        period,
        generated_at: new Date().toISOString(),
        volunteers: summaries,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
