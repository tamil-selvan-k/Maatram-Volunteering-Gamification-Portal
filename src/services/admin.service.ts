import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import { allocateOpportunity } from '@/lib/priority'
import type { VolunteerProfile, OpportunityProfile, CompletedActivity } from '@/lib/priority'
import type { Result, PaginatedResult, Opportunity, RegistrationStatus, ActivityType, OpportunityStatus, Volunteer } from '@/types'

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

// ─── Create / Update Opportunity ─────────────────────────────────────────────

export interface CreateOpportunityInput {
  title: string
  description: string | null
  activity_type: ActivityType
  mode: 'online' | 'offline'
  location: string | null
  event_date: string
  duration_hours: number
  total_slots: number
  registration_deadline: string
  required_skills: string[]
  mandatory_skills: string[]
}

export type UpdateOpportunityInput = Partial<CreateOpportunityInput> & {
  status?: OpportunityStatus
}

export async function createOpportunity(
  input: CreateOpportunityInput
): Promise<Result<Opportunity>> {
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      return { data: null, error: toAppError(authErr ?? new Error('Not authenticated')) }
    }

    const { data, error } = await supabase
      .from('opportunities')
      .insert({ ...input, created_by: user.id, status: 'open' as OpportunityStatus })
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as Opportunity, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput
): Promise<Result<Opportunity>> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .update(input)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as Opportunity, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Activity report ──────────────────────────────────────────────────────────

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

// ─── Delete opportunity ───────────────────────────────────────────────────────

export async function deleteOpportunity(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Verification review ──────────────────────────────────────────────────────

export interface PendingVerificationRow {
  id: string
  registration_id: string
  volunteer_id: string
  volunteer_name: string
  volunteer_email: string
  opportunity_id: string
  opportunity_title: string
  photo_url: string
  verification_level: string
  created_at: string
}

export async function getPendingVerifications(
  opportunityId?: string
): Promise<Result<PendingVerificationRow[]>> {
  try {
    const { data: verifications, error: verErr } = await supabase
      .from('verifications')
      .select('id, registration_id, photo_url, verification_level, created_at')
      .eq('verification_level', 'photo_pending')
      .eq('admin_approved', false)
      .not('photo_url', 'is', null)

    if (verErr) return { data: null, error: toAppError(verErr) }

    const vers = (verifications ?? []) as Array<{
      id: string
      registration_id: string
      photo_url: string
      verification_level: string
      created_at: string
    }>

    if (vers.length === 0) return { data: [], error: null }

    const regIds = vers.map((v) => v.registration_id)
    const { data: registrations, error: regErr } = await supabase
      .from('registrations')
      .select('id, volunteer_id, opportunity_id')
      .in('id', regIds)

    if (regErr) return { data: null, error: toAppError(regErr) }

    const regs = (registrations ?? []) as Array<{
      id: string
      volunteer_id: string
      opportunity_id: string
    }>

    // Filter by opportunityId if specified
    const filteredRegs = opportunityId
      ? regs.filter((r) => r.opportunity_id === opportunityId)
      : regs

    if (filteredRegs.length === 0) return { data: [], error: null }

    const filteredRegIds = new Set(filteredRegs.map((r) => r.id))
    const filteredVers = vers.filter((v) => filteredRegIds.has(v.registration_id))

    if (filteredVers.length === 0) return { data: [], error: null }

    const volunteerIds = [...new Set(filteredRegs.map((r) => r.volunteer_id))]
    const opportunityIds = [...new Set(filteredRegs.map((r) => r.opportunity_id))]

    const [{ data: volunteers, error: volErr }, { data: opportunities, error: oppErr }] =
      await Promise.all([
        supabase.from('volunteers').select('id, full_name, email').in('id', volunteerIds),
        supabase.from('opportunities').select('id, title').in('id', opportunityIds),
      ])

    if (volErr) return { data: null, error: toAppError(volErr) }
    if (oppErr) return { data: null, error: toAppError(oppErr) }

    const regMap = new Map(filteredRegs.map((r) => [r.id, r]))
    const volMap = new Map(
      ((volunteers ?? []) as Array<{ id: string; full_name: string; email: string }>).map((v) => [
        v.id,
        v,
      ])
    )
    const oppMap = new Map(
      ((opportunities ?? []) as Array<{ id: string; title: string }>).map((o) => [o.id, o])
    )

    const rows: PendingVerificationRow[] = filteredVers.map((ver) => {
      const reg = regMap.get(ver.registration_id)!
      const vol = volMap.get(reg.volunteer_id)
      const opp = oppMap.get(reg.opportunity_id)
      return {
        id: ver.id,
        registration_id: ver.registration_id,
        volunteer_id: reg.volunteer_id,
        volunteer_name: vol?.full_name ?? 'Unknown',
        volunteer_email: vol?.email ?? '',
        opportunity_id: reg.opportunity_id,
        opportunity_title: opp?.title ?? '',
        photo_url: ver.photo_url,
        verification_level: ver.verification_level,
        created_at: ver.created_at,
      }
    })

    return { data: rows, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function approveVerification(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('verifications')
      .update({ admin_approved: true })
      .eq('id', id)

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function rejectVerification(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase.from('verifications').delete().eq('id', id)

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Run allocation ───────────────────────────────────────────────────────────

export async function runAllocation(
  opportunityId: string
): Promise<Result<{ selected: string[]; waitlisted: string[] }>> {
  try {
    // 1. Fetch opportunity
    const { data: oppData, error: oppErr } = await supabase
      .from('opportunities')
      .select('id, total_slots, activity_type, required_skills, mandatory_skills')
      .eq('id', opportunityId)
      .single()

    if (oppErr || !oppData) {
      return { data: null, error: toAppError(oppErr ?? new Error('Opportunity not found')) }
    }

    const opp = oppData as {
      id: string
      total_slots: number
      activity_type: string
      required_skills: string[]
      mandatory_skills: string[]
    }

    // 2. Fetch registered registrations
    const { data: registrations, error: regErr } = await supabase
      .from('registrations')
      .select('id, volunteer_id')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'registered')

    if (regErr) return { data: null, error: toAppError(regErr) }

    const regs = (registrations ?? []) as Array<{ id: string; volunteer_id: string }>

    if (regs.length === 0) {
      return { data: { selected: [], waitlisted: [] }, error: null }
    }

    const volunteerIds = regs.map((r) => r.volunteer_id)

    // 3. Fetch volunteer rows
    const { data: volunteers, error: volErr } = await supabase
      .from('volunteers')
      .select(
        'id, created_at, preferences, skills, consecutive_rejections, times_selected, times_completed'
      )
      .in('id', volunteerIds)

    if (volErr) return { data: null, error: toAppError(volErr) }

    type VolRow = {
      id: string
      created_at: string
      preferences: string[]
      skills: string[]
      consecutive_rejections: number
      times_selected: number
      times_completed: number
    }
    const volRows = (volunteers ?? []) as VolRow[]

    // 4. Fetch completed activities for each volunteer (from previous selected+verified regs)
    const { data: prevRegs, error: prevRegErr } = await supabase
      .from('registrations')
      .select('id, volunteer_id, opportunity_id')
      .in('volunteer_id', volunteerIds)
      .eq('status', 'selected')

    if (prevRegErr) return { data: null, error: toAppError(prevRegErr) }

    const prevRegsArr = (prevRegs ?? []) as Array<{
      id: string
      volunteer_id: string
      opportunity_id: string
    }>

    const completedActivitiesMap = new Map<string, CompletedActivity[]>()

    if (prevRegsArr.length > 0) {
      const prevRegIds = prevRegsArr.map((r) => r.id)
      const { data: verData } = await supabase
        .from('verifications')
        .select('registration_id, checkout_time')
        .in('registration_id', prevRegIds)
        .not('checkout_time', 'is', null)

      const verRows = (verData ?? []) as Array<{
        registration_id: string
        checkout_time: string
      }>

      if (verRows.length > 0) {
        const verMap = new Map(verRows.map((v) => [v.registration_id, v.checkout_time]))
        const oppIds = [...new Set(prevRegsArr.map((r) => r.opportunity_id))]

        const { data: oppsData } = await supabase
          .from('opportunities')
          .select('id, activity_type')
          .in('id', oppIds)

        const oppTypeMap = new Map(
          ((oppsData ?? []) as Array<{ id: string; activity_type: string }>).map((o) => [
            o.id,
            o.activity_type as ActivityType,
          ])
        )

        for (const reg of prevRegsArr) {
          const checkoutTime = verMap.get(reg.id)
          if (!checkoutTime) continue
          const type = oppTypeMap.get(reg.opportunity_id)
          if (!type) continue
          const existing = completedActivitiesMap.get(reg.volunteer_id) ?? []
          completedActivitiesMap.set(reg.volunteer_id, [
            ...existing,
            { type, completedAt: checkoutTime },
          ])
        }
      }
    }

    // 5. Build VolunteerProfile objects
    const applicants: VolunteerProfile[] = volRows.map((vol) => ({
      id: vol.id,
      createdAt: vol.created_at,
      preferences: vol.preferences as ActivityType[],
      skills: vol.skills,
      consecutiveRejections: vol.consecutive_rejections,
      timesSelected: vol.times_selected,
      timesCompleted: vol.times_completed,
      completedActivities: completedActivitiesMap.get(vol.id) ?? [],
    }))

    // 6. Build OpportunityProfile
    const oppProfile: OpportunityProfile = {
      activityType: opp.activity_type as ActivityType,
      requiredSkills: opp.required_skills,
      mandatorySkills: opp.mandatory_skills,
      totalSlots: opp.total_slots,
    }

    // 7. Run algorithm
    const result = allocateOpportunity(oppProfile, applicants)

    // 8. Map volunteer IDs → registration IDs
    const volToRegId = new Map(regs.map((r) => [r.volunteer_id, r.id]))

    const selectedRegIds = result.selected
      .map((volId) => volToRegId.get(volId))
      .filter((id): id is string => !!id)

    const waitlistedRegIds = result.waitlisted
      .map((volId) => volToRegId.get(volId))
      .filter((id): id is string => !!id)

    // 9. Persist statuses
    if (selectedRegIds.length > 0) {
      const { error: selErr } = await supabase
        .from('registrations')
        .update({ status: 'selected' as RegistrationStatus })
        .in('id', selectedRegIds)
      if (selErr) return { data: null, error: toAppError(selErr) }
    }

    if (waitlistedRegIds.length > 0) {
      const { error: wlErr } = await supabase
        .from('registrations')
        .update({ status: 'waitlisted' as RegistrationStatus })
        .in('id', waitlistedRegIds)
      if (wlErr) return { data: null, error: toAppError(wlErr) }
    }

    return { data: { selected: result.selected, waitlisted: result.waitlisted }, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Volunteer management ─────────────────────────────────────────────────────

export async function getVolunteers(
  page = 1,
  search?: string,
  pageSize = 20
): Promise<Result<PaginatedResult<Volunteer>>> {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('volunteers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search?.trim()) {
      query = query.or(
        `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
      )
    }

    const { data, error, count } = await query

    if (error) return { data: null, error: toAppError(error) }

    return {
      data: {
        items: (data as Volunteer[]) ?? [],
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

export async function updateVolunteerAdmin(
  id: string,
  updates: { is_admin?: boolean; do_not_contact?: boolean; is_active?: boolean }
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

// ─── Activity types ───────────────────────────────────────────────────────────

export interface ActivityTypeRow {
  id: string
  key: string
  label: string
  accent: string
  is_active: boolean
  created_at: string
}

export async function getActivityTypes(): Promise<Result<ActivityTypeRow[]>> {
  try {
    const { data, error } = await supabase
      .from('activity_types')
      .select('*')
      .eq('is_active', true)
      .order('label', { ascending: true })

    if (error) return { data: null, error: toAppError(error) }
    return { data: (data as ActivityTypeRow[]) ?? [], error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function createActivityType(
  key: string,
  label: string,
  accent: string
): Promise<Result<ActivityTypeRow>> {
  try {
    const { data, error } = await supabase
      .from('activity_types')
      .insert({ key, label, accent })
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as ActivityTypeRow, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function deleteActivityType(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('activity_types')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return { data: null, error: toAppError(error) }
    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
