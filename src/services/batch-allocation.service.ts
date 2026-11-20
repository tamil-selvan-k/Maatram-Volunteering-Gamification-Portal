import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import { runBatchMatching } from '@/lib/batch-allocation'
import type { BatchOpportunity, BatchVolunteer } from '@/lib/batch-allocation'
import type { Result, ActivityType, RegistrationStatus } from '@/types'

export interface BatchAllocationSummary {
  runIds: string[]
  totalAssigned: number
  totalUnfilled: number
  perOpportunity: Array<{
    opportunityId: string
    title: string
    selected: number
    waitlisted: number
    unfilled: number
  }>
}

export async function runBatchAllocation(
  opportunityIds: string[],
  adminId: string,
  isDryRun = false
): Promise<Result<BatchAllocationSummary>> {
  try {
    const { data: oppRows, error: oppErr } = await supabase
      .from('opportunities')
      .select(
        'id, title, activity_type, required_skills, mandatory_skills, total_slots, priority, event_date, duration_hours, mode'
      )
      .in('id', opportunityIds)

    if (oppErr) return { data: null, error: toAppError(oppErr) }
    if (!oppRows || oppRows.length === 0) {
      return { data: null, error: toAppError(new Error('No opportunities found')) }
    }

    type OppRow = {
      id: string
      title: string
      activity_type: string
      required_skills: string[]
      mandatory_skills: string[]
      total_slots: number
      priority: number
      event_date: string
      duration_hours: number
      mode: 'online' | 'offline'
    }
    const opps = oppRows as OppRow[]

    const { data: allRegs, error: regErr } = await supabase
      .from('registrations')
      .select('id, volunteer_id, opportunity_id')
      .in('opportunity_id', opportunityIds)
      .eq('status', 'registered')

    if (regErr) return { data: null, error: toAppError(regErr) }

    const regs = (allRegs ?? []) as Array<{
      id: string
      volunteer_id: string
      opportunity_id: string
    }>

    const registrationsByOpp = new Map<string, string[]>()
    const regLookup = new Map<string, Array<{ id: string; volunteer_id: string }>>()
    for (const reg of regs) {
      const list = registrationsByOpp.get(reg.opportunity_id) ?? []
      list.push(reg.volunteer_id)
      registrationsByOpp.set(reg.opportunity_id, list)

      const regList = regLookup.get(reg.opportunity_id) ?? []
      regList.push({ id: reg.id, volunteer_id: reg.volunteer_id })
      regLookup.set(reg.opportunity_id, regList)
    }

    const allVolunteerIds = [...new Set(regs.map((r) => r.volunteer_id))]

    let volRows: Array<{
      id: string
      preferences: string[]
      skills: string[]
      times_selected: number
      times_completed: number
    }> = []

    if (allVolunteerIds.length > 0) {
      const { data: volunteers, error: volErr } = await supabase
        .from('volunteers')
        .select('id, preferences, skills, times_selected, times_completed')
        .in('id', allVolunteerIds)

      if (volErr) return { data: null, error: toAppError(volErr) }
      volRows = (volunteers ?? []) as typeof volRows
    }

    let maxHoursMap = new Map<string, number | null>()
    if (allVolunteerIds.length > 0) {
      const { data: availData } = await supabase
        .from('volunteer_availability')
        .select('volunteer_id, max_weekly_hours')
        .in('volunteer_id', allVolunteerIds)
        .eq('type', 'recurring')

      if (availData) {
        for (const row of availData as Array<{
          volunteer_id: string
          max_weekly_hours: number | null
        }>) {
          if (row.max_weekly_hours !== null) {
            const existing = maxHoursMap.get(row.volunteer_id)
            if (existing === undefined || existing === null) {
              maxHoursMap.set(row.volunteer_id, row.max_weekly_hours)
            }
          }
        }
      }
    }

    const { data: existingSelectedRegs } = await supabase
      .from('registrations')
      .select('volunteer_id, opportunity_id')
      .in('volunteer_id', allVolunteerIds.length > 0 ? allVolunteerIds : ['__none__'])
      .eq('status', 'selected')

    const existingAssignments = new Map<string, string[]>()
    for (const row of (existingSelectedRegs ?? []) as Array<{
      volunteer_id: string
      opportunity_id: string
    }>) {
      const list = existingAssignments.get(row.volunteer_id) ?? []
      list.push(row.opportunity_id)
      existingAssignments.set(row.volunteer_id, list)
    }

    const filledSlotsMap = new Map<string, number>()
    for (const oppId of opportunityIds) {
      const { count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('opportunity_id', oppId)
        .eq('status', 'selected')
      filledSlotsMap.set(oppId, count ?? 0)
    }

    const batchOpps: BatchOpportunity[] = opps.map((o) => ({
      id: o.id,
      activityType: o.activity_type as ActivityType,
      requiredSkills: o.required_skills,
      mandatorySkills: o.mandatory_skills,
      totalSlots: o.total_slots,
      filledSlots: filledSlotsMap.get(o.id) ?? 0,
      priority: o.priority,
      eventDate: o.event_date,
      durationHours: o.duration_hours,
      mode: o.mode,
    }))

    const batchVols: BatchVolunteer[] = volRows.map((v) => ({
      id: v.id,
      skills: v.skills,
      preferences: v.preferences as ActivityType[],
      timesSelected: v.times_selected,
      timesCompleted: v.times_completed,
      maxWeeklyHours: maxHoursMap.get(v.id) ?? null,
      assignedHours: 0,
      assignedOpportunityIds: existingAssignments.get(v.id) ?? [],
    }))

    const result = runBatchMatching(batchOpps, batchVols, registrationsByOpp)

    const titleMap = new Map(opps.map((o) => [o.id, o.title]))

    if (isDryRun) {
      const assignmentsByOpp = new Map<string, number>()
      for (const a of result.assignments) {
        assignmentsByOpp.set(a.opportunityId, (assignmentsByOpp.get(a.opportunityId) ?? 0) + 1)
      }

      const unfilledMap = new Map(result.unfilledSlots.map((u) => [u.opportunityId, u.remaining]))

      const perOpportunity = opportunityIds.map((oppId) => {
        const selected = assignmentsByOpp.get(oppId) ?? 0
        const oppRegs = registrationsByOpp.get(oppId) ?? []
        const assignedSet = new Set(
          result.assignments.filter((a) => a.opportunityId === oppId).map((a) => a.volunteerId)
        )
        const waitlisted = oppRegs.filter((v) => !assignedSet.has(v)).length
        return {
          opportunityId: oppId,
          title: titleMap.get(oppId) ?? '',
          selected,
          waitlisted,
          unfilled: unfilledMap.get(oppId) ?? 0,
        }
      })

      return {
        data: {
          runIds: [],
          totalAssigned: result.assignments.length,
          totalUnfilled: result.unfilledSlots.reduce((s, u) => s + u.remaining, 0),
          perOpportunity,
        },
        error: null,
      }
    }

    const runIds: string[] = []
    const assignmentsByOpp = new Map<string, typeof result.assignments>()
    for (const a of result.assignments) {
      const list = assignmentsByOpp.get(a.opportunityId) ?? []
      list.push(a)
      assignmentsByOpp.set(a.opportunityId, list)
    }
    const unfilledMap = new Map(result.unfilledSlots.map((u) => [u.opportunityId, u.remaining]))

    for (const oppId of opportunityIds) {
      const oppAssignments = assignmentsByOpp.get(oppId) ?? []
      const oppRegs = regLookup.get(oppId) ?? []
      const assignedVolIds = new Set(oppAssignments.map((a) => a.volunteerId))

      const selectedRegs = oppRegs.filter((r) => assignedVolIds.has(r.volunteer_id))
      const waitlistedRegs = oppRegs.filter((r) => !assignedVolIds.has(r.volunteer_id))

      const seed = `batch-${oppId}-${Date.now()}`
      const { data: runData, error: runErr } = await supabase
        .from('allocation_runs')
        .insert({
          opportunity_id: oppId,
          algorithm_version: 'v3-batch',
          run_by: adminId,
          total_applicants: oppRegs.length,
          eligible_count: selectedRegs.length + waitlistedRegs.length,
          selected_count: selectedRegs.length,
          waitlisted_count: waitlistedRegs.length,
          seed,
          is_dry_run: false,
        })
        .select('id')
        .single()

      if (runErr || !runData) {
        return {
          data: null,
          error: toAppError(runErr ?? new Error('Failed to persist allocation run')),
        }
      }

      const runId = (runData as { id: string }).id
      runIds.push(runId)

      const scoreMap = new Map(oppAssignments.map((a) => [a.volunteerId, a.score]))

      const outcomes: Array<{
        run_id: string
        volunteer_id: string
        outcome: string
        score: number | null
        score_breakdown: Record<string, unknown> | null
        waitlist_position: number | null
        exclusion_reason: string | null
      }> = []

      for (const reg of selectedRegs) {
        const score = scoreMap.get(reg.volunteer_id)
        outcomes.push({
          run_id: runId,
          volunteer_id: reg.volunteer_id,
          outcome: 'selected',
          score: score ?? null,
          score_breakdown: null,
          waitlist_position: null,
          exclusion_reason: null,
        })
      }

      for (let i = 0; i < waitlistedRegs.length; i++) {
        outcomes.push({
          run_id: runId,
          volunteer_id: waitlistedRegs[i]!.volunteer_id,
          outcome: 'waitlisted',
          score: null,
          score_breakdown: null,
          waitlist_position: i + 1,
          exclusion_reason: null,
        })
      }

      if (outcomes.length > 0) {
        const { error: outErr } = await supabase.from('allocation_outcomes').insert(outcomes)
        if (outErr) return { data: null, error: toAppError(outErr) }
      }

      for (const reg of selectedRegs) {
        const score = scoreMap.get(reg.volunteer_id)
        await supabase
          .from('registrations')
          .update({
            status: 'selected' as RegistrationStatus,
            priority_score: score ?? null,
          })
          .eq('id', reg.id)
      }

      for (let i = 0; i < waitlistedRegs.length; i++) {
        await supabase
          .from('registrations')
          .update({
            status: 'waitlisted' as RegistrationStatus,
            waitlist_position: i + 1,
          })
          .eq('id', waitlistedRegs[i]!.id)
      }
    }

    const perOpportunity = opportunityIds.map((oppId) => {
      const oppAssignments = assignmentsByOpp.get(oppId) ?? []
      const oppRegs = regLookup.get(oppId) ?? []
      const assignedSet = new Set(oppAssignments.map((a) => a.volunteerId))
      return {
        opportunityId: oppId,
        title: titleMap.get(oppId) ?? '',
        selected: oppAssignments.length,
        waitlisted: oppRegs.filter((r) => !assignedSet.has(r.volunteer_id)).length,
        unfilled: unfilledMap.get(oppId) ?? 0,
      }
    })

    return {
      data: {
        runIds,
        totalAssigned: result.assignments.length,
        totalUnfilled: result.unfilledSlots.reduce((s, u) => s + u.remaining, 0),
        perOpportunity,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
