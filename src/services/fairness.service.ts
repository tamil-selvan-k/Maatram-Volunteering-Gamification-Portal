import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Result } from '@/types'

export interface FairnessFilters {
  dateFrom?: string
  dateTo?: string
  activityType?: string
}

export interface FairnessOverview {
  totalRuns: number
  totalApplicants: number
  totalEligible: number
  totalSelected: number
  totalWaitlisted: number
  selectionRate: number
  fillRate: number
  totalSlots: number
  filledSlots: number
  completionRate: number
  noShowRate: number
  cancellationRate: number
  totalCompleted: number
  totalNoShow: number
  totalCancelled: number
  waitlistConversion: number
  firstTimeApplicants: number
  firstTimeSelected: number
  firstTimeSelectionRate: number
}

export interface OpportunityMetric {
  opportunityId: string
  title: string
  activityType: string
  eventDate: string
  priority: number
  totalSlots: number
  applicants: number
  eligible: number
  selected: number
  waitlisted: number
  completed: number
  noShow: number
  fillRate: number
  selectionRate: number
  completionRate: number
}

export interface VolunteerDistributionEntry {
  volunteerId: string
  name: string
  timesSelected: number
  timesCompleted: number
  timesNoShow: number
  selectionRate: number
  applicationsCount: number
}

type RunRow = {
  id: string
  opportunity_id: string
  total_applicants: number
  eligible_count: number
  selected_count: number
  waitlisted_count: number
  run_at: string
}

type OppRow = {
  id: string
  title: string
  activity_type: string
  event_date: string
  priority: number
  total_slots: number
}

type RegRow = {
  opportunity_id: string
  volunteer_id: string
  status: string
}

export async function getFairnessOverview(
  filters: FairnessFilters
): Promise<Result<FairnessOverview>> {
  try {
    let validOppIds: string[] | null = null
    if (filters.activityType || filters.dateFrom || filters.dateTo) {
      let oppQuery = supabase.from('opportunities').select('id, event_date')
      if (filters.activityType) oppQuery = oppQuery.eq('activity_type', filters.activityType)
      if (filters.dateFrom) oppQuery = oppQuery.gte('event_date', filters.dateFrom)
      if (filters.dateTo) oppQuery = oppQuery.lte('event_date', filters.dateTo)
      const { data: oppData } = await oppQuery
      validOppIds = (oppData as OppRow[] | null)?.map((o) => o.id) ?? []
    }

    let runsQuery = supabase
      .from('allocation_runs')
      .select('id, opportunity_id, total_applicants, eligible_count, selected_count, waitlisted_count, run_at')
      .eq('is_dry_run', false)

    if (validOppIds) {
      if (validOppIds.length === 0) {
        return { data: emptyOverview(), error: null }
      }
      runsQuery = runsQuery.in('opportunity_id', validOppIds)
    }

    const { data: runs, error: runsErr } = await runsQuery
    if (runsErr) return { data: null, error: toAppError(runsErr) }

    const allRuns = (runs ?? []) as RunRow[]
    if (allRuns.length === 0) return { data: emptyOverview(), error: null }

    let totalApplicants = 0
    let totalEligible = 0
    let totalSelected = 0
    let totalWaitlisted = 0
    for (const run of allRuns) {
      totalApplicants += run.total_applicants ?? 0
      totalEligible += run.eligible_count ?? 0
      totalSelected += run.selected_count ?? 0
      totalWaitlisted += run.waitlisted_count ?? 0
    }

    const oppIds = [...new Set(allRuns.map((r) => r.opportunity_id))]

    const [slotsResult, regsResult, waitlistResult] = await Promise.all([
      supabase.from('opportunities').select('id, total_slots').in('id', oppIds),
      supabase.from('registrations').select('opportunity_id, volunteer_id, status').in('opportunity_id', oppIds),
      supabase
        .from('allocation_outcomes')
        .select('volunteer_id')
        .in('run_id', allRuns.map((r) => r.id))
        .eq('outcome', 'waitlisted'),
    ])

    let totalSlots = 0
    for (const opp of (slotsResult.data ?? []) as OppRow[]) {
      totalSlots += opp.total_slots ?? 0
    }

    const regs = (regsResult.data ?? []) as RegRow[]
    let filledSlots = 0
    let totalCompleted = 0
    let totalNoShow = 0
    let totalCancelled = 0

    const volApplications = new Map<string, { applied: number; selected: boolean }>()

    for (const reg of regs) {
      if (reg.status === 'selected' || reg.status === 'completed') filledSlots++
      if (reg.status === 'completed') totalCompleted++
      if (reg.status === 'no_show') totalNoShow++
      if (reg.status === 'cancelled') totalCancelled++

      const entry = volApplications.get(reg.volunteer_id) ?? { applied: 0, selected: false }
      entry.applied++
      if (reg.status === 'selected' || reg.status === 'completed') entry.selected = true
      volApplications.set(reg.volunteer_id, entry)
    }

    const waitlistedVols = new Set(
      ((waitlistResult.data ?? []) as { volunteer_id: string }[]).map((w) => w.volunteer_id)
    )
    let waitlistConverted = 0
    for (const reg of regs) {
      if (
        waitlistedVols.has(reg.volunteer_id) &&
        (reg.status === 'selected' || reg.status === 'completed')
      ) {
        waitlistConverted++
      }
    }

    let firstTimeApplicants = 0
    let firstTimeSelected = 0
    const firstTimeVolIds = [...volApplications.entries()]
      .filter(([, v]) => v.applied === 1)
      .map(([id]) => id)

    if (firstTimeVolIds.length > 0) {
      const { data: volData } = await supabase
        .from('volunteers')
        .select('id, times_selected')
        .in('id', firstTimeVolIds.slice(0, 500))

      for (const vol of (volData ?? []) as { id: string; times_selected: number }[]) {
        if (vol.times_selected <= 1) {
          firstTimeApplicants++
          if (volApplications.get(vol.id)?.selected) firstTimeSelected++
        }
      }
    }

    const selectionRate = totalEligible > 0 ? (totalSelected / totalEligible) * 100 : 0
    const fillRate = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0
    const base = totalSelected || 1
    const completionRate = totalSelected > 0 ? (totalCompleted / base) * 100 : 0
    const noShowRate = totalSelected > 0 ? (totalNoShow / base) * 100 : 0
    const cancellationRate = totalSelected > 0 ? (totalCancelled / base) * 100 : 0
    const waitlistConversion = totalWaitlisted > 0 ? (waitlistConverted / totalWaitlisted) * 100 : 0
    const firstTimeSelectionRate =
      firstTimeApplicants > 0 ? (firstTimeSelected / firstTimeApplicants) * 100 : 0

    return {
      data: {
        totalRuns: allRuns.length,
        totalApplicants,
        totalEligible,
        totalSelected,
        totalWaitlisted,
        selectionRate,
        fillRate,
        totalSlots,
        filledSlots,
        completionRate,
        noShowRate,
        cancellationRate,
        totalCompleted,
        totalNoShow,
        totalCancelled,
        waitlistConversion,
        firstTimeApplicants,
        firstTimeSelected,
        firstTimeSelectionRate,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getOpportunityMetrics(
  filters: FairnessFilters
): Promise<Result<OpportunityMetric[]>> {
  try {
    let oppQuery = supabase
      .from('opportunities')
      .select('id, title, activity_type, event_date, priority, total_slots')
      .order('event_date', { ascending: false })
      .limit(50)

    if (filters.activityType) oppQuery = oppQuery.eq('activity_type', filters.activityType)
    if (filters.dateFrom) oppQuery = oppQuery.gte('event_date', filters.dateFrom)
    if (filters.dateTo) oppQuery = oppQuery.lte('event_date', filters.dateTo)

    const { data: opps, error: oppErr } = await oppQuery
    if (oppErr) return { data: null, error: toAppError(oppErr) }
    if (!opps || opps.length === 0) return { data: [], error: null }

    const oppIds = (opps as OppRow[]).map((o) => o.id)

    const [runsResult, regsResult] = await Promise.all([
      supabase
        .from('allocation_runs')
        .select('opportunity_id, total_applicants, eligible_count, selected_count, waitlisted_count')
        .in('opportunity_id', oppIds)
        .eq('is_dry_run', false),
      supabase.from('registrations').select('opportunity_id, status').in('opportunity_id', oppIds),
    ])

    const runsByOpp = new Map<string, RunRow>()
    for (const run of (runsResult.data ?? []) as RunRow[]) {
      runsByOpp.set(run.opportunity_id, run)
    }

    const regCountsByOpp = new Map<string, Record<string, number>>()
    for (const reg of (regsResult.data ?? []) as RegRow[]) {
      const counts = regCountsByOpp.get(reg.opportunity_id) ?? {}
      counts[reg.status] = (counts[reg.status] ?? 0) + 1
      regCountsByOpp.set(reg.opportunity_id, counts)
    }

    const metrics: OpportunityMetric[] = (opps as OppRow[]).map((opp) => {
      const run = runsByOpp.get(opp.id)
      const counts = regCountsByOpp.get(opp.id) ?? {}
      const applicants = run?.total_applicants ?? 0
      const eligible = run?.eligible_count ?? 0
      const selected = (counts['selected'] ?? 0) + (counts['completed'] ?? 0)
      const waitlisted = counts['waitlisted'] ?? 0
      const completed = counts['completed'] ?? 0
      const noShow = counts['no_show'] ?? 0

      return {
        opportunityId: opp.id,
        title: opp.title,
        activityType: opp.activity_type,
        eventDate: opp.event_date,
        priority: opp.priority ?? 3,
        totalSlots: opp.total_slots,
        applicants,
        eligible,
        selected,
        waitlisted,
        completed,
        noShow,
        fillRate: opp.total_slots > 0 ? (selected / opp.total_slots) * 100 : 0,
        selectionRate: eligible > 0 ? (selected / eligible) * 100 : 0,
        completionRate: selected > 0 ? (completed / selected) * 100 : 0,
      }
    })

    return { data: metrics, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getVolunteerDistribution(
  filters: FairnessFilters
): Promise<Result<VolunteerDistributionEntry[]>> {
  try {
    let oppIds: string[] | null = null
    if (filters.activityType || filters.dateFrom || filters.dateTo) {
      let oppQuery = supabase.from('opportunities').select('id')
      if (filters.activityType) oppQuery = oppQuery.eq('activity_type', filters.activityType)
      if (filters.dateFrom) oppQuery = oppQuery.gte('event_date', filters.dateFrom)
      if (filters.dateTo) oppQuery = oppQuery.lte('event_date', filters.dateTo)
      const { data } = await oppQuery
      oppIds = (data as { id: string }[] | null)?.map((o) => o.id) ?? []
      if (oppIds.length === 0) return { data: [], error: null }
    }

    let regsQuery = supabase.from('registrations').select('volunteer_id, status, opportunity_id')
    if (oppIds) regsQuery = regsQuery.in('opportunity_id', oppIds)

    const { data: regs, error: regsErr } = await regsQuery
    if (regsErr) return { data: null, error: toAppError(regsErr) }

    const volStats = new Map<
      string,
      { applied: number; selected: number; completed: number; noShow: number }
    >()

    for (const reg of (regs ?? []) as RegRow[]) {
      const entry = volStats.get(reg.volunteer_id) ?? {
        applied: 0,
        selected: 0,
        completed: 0,
        noShow: 0,
      }
      entry.applied++
      if (reg.status === 'selected') entry.selected++
      if (reg.status === 'completed') {
        entry.selected++
        entry.completed++
      }
      if (reg.status === 'no_show') entry.noShow++
      volStats.set(reg.volunteer_id, entry)
    }

    const volIds = [...volStats.keys()].slice(0, 200)
    if (volIds.length === 0) return { data: [], error: null }

    const { data: volData } = await supabase
      .from('volunteers')
      .select('id, full_name')
      .in('id', volIds)

    const nameMap = new Map<string, string>()
    for (const v of (volData ?? []) as { id: string; full_name: string }[]) {
      nameMap.set(v.id, v.full_name)
    }

    const distribution: VolunteerDistributionEntry[] = volIds
      .map((id) => {
        const stats = volStats.get(id)!
        return {
          volunteerId: id,
          name: nameMap.get(id) ?? 'Unknown',
          timesSelected: stats.selected,
          timesCompleted: stats.completed,
          timesNoShow: stats.noShow,
          selectionRate: stats.applied > 0 ? (stats.selected / stats.applied) * 100 : 0,
          applicationsCount: stats.applied,
        }
      })
      .sort((a, b) => b.timesSelected - a.timesSelected)

    return { data: distribution, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

function emptyOverview(): FairnessOverview {
  return {
    totalRuns: 0,
    totalApplicants: 0,
    totalEligible: 0,
    totalSelected: 0,
    totalWaitlisted: 0,
    selectionRate: 0,
    fillRate: 0,
    totalSlots: 0,
    filledSlots: 0,
    completionRate: 0,
    noShowRate: 0,
    cancellationRate: 0,
    totalCompleted: 0,
    totalNoShow: 0,
    totalCancelled: 0,
    waitlistConversion: 0,
    firstTimeApplicants: 0,
    firstTimeSelected: 0,
    firstTimeSelectionRate: 0,
  }
}
