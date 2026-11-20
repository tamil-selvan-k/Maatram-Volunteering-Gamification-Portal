import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import { allocateOpportunity } from '@/lib/priority'
import type { VolunteerProfile, OpportunityProfile } from '@/lib/priority'
import type { Result, AllocationRun, AllocationOutcome, ActivityType } from '@/types'

export async function runAllocation(
  opportunityId: string,
  adminId: string,
  isDryRun = false
): Promise<Result<AllocationRun>> {
  try {
    const { data: oppData, error: oppErr } = await supabase
      .from('opportunities')
      .select('id, title, total_slots, activity_type, required_skills, mandatory_skills')
      .eq('id', opportunityId)
      .single()

    if (oppErr || !oppData) {
      return { data: null, error: toAppError(oppErr ?? new Error('Opportunity not found')) }
    }

    const opp = oppData as {
      id: string
      title: string
      total_slots: number
      activity_type: string
      required_skills: string[]
      mandatory_skills: string[]
    }

    const { data: registrations, error: regErr } = await supabase
      .from('registrations')
      .select('id, volunteer_id')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'registered')

    if (regErr) return { data: null, error: toAppError(regErr) }

    const regs = (registrations ?? []) as Array<{ id: string; volunteer_id: string }>
    const volunteerIds = regs.map((r) => r.volunteer_id)

    let volRows: Array<{
      id: string
      created_at: string
      preferences: string[]
      skills: string[]
      times_selected: number
      times_completed: number
    }> = []

    if (volunteerIds.length > 0) {
      const { data: volunteers, error: volErr } = await supabase
        .from('volunteers')
        .select('id, created_at, preferences, skills, times_selected, times_completed')
        .in('id', volunteerIds)

      if (volErr) return { data: null, error: toAppError(volErr) }
      volRows = (volunteers ?? []) as typeof volRows
    }

    const applicants: VolunteerProfile[] = volRows.map((vol) => ({
      id: vol.id,
      createdAt: vol.created_at,
      preferences: vol.preferences as ActivityType[],
      skills: vol.skills,
      timesSelected: vol.times_selected,
      timesCompleted: vol.times_completed,
    }))

    const oppProfile: OpportunityProfile = {
      activityType: opp.activity_type as ActivityType,
      requiredSkills: opp.required_skills,
      mandatorySkills: opp.mandatory_skills,
      totalSlots: opp.total_slots,
    }

    const seed = `${opportunityId}-${Date.now()}`
    const result = allocateOpportunity(oppProfile, applicants, seed)

    const eligibleIds = new Set([...result.selected, ...result.waitlisted])
    const excludedIds = volunteerIds.filter((id) => !eligibleIds.has(id))

    const { data: runData, error: runErr } = await supabase
      .from('allocation_runs')
      .insert({
        opportunity_id: opportunityId,
        algorithm_version: 'v2',
        run_by: adminId,
        total_applicants: regs.length,
        eligible_count: eligibleIds.size,
        selected_count: result.selected.length,
        waitlisted_count: result.waitlisted.length,
        seed,
        is_dry_run: isDryRun,
      })
      .select('*')
      .single()

    if (runErr || !runData) {
      return { data: null, error: toAppError(runErr ?? new Error('Failed to persist allocation run')) }
    }

    const run = runData as AllocationRun
    const scoreMap = new Map(result.scores.map((s) => [s.volunteerId, s]))

    const outcomes: Array<{
      run_id: string
      volunteer_id: string
      outcome: string
      score: number | null
      score_breakdown: Record<string, unknown> | null
      waitlist_position: number | null
      exclusion_reason: string | null
    }> = []

    for (const volId of result.selected) {
      const score = scoreMap.get(volId)
      outcomes.push({
        run_id: run.id,
        volunteer_id: volId,
        outcome: 'selected',
        score: score?.total ?? null,
        score_breakdown: score ? { L: score.L, P: score.P } : null,
        waitlist_position: null,
        exclusion_reason: null,
      })
    }

    for (let i = 0; i < result.waitlisted.length; i++) {
      const volId = result.waitlisted[i]!
      const score = scoreMap.get(volId)
      outcomes.push({
        run_id: run.id,
        volunteer_id: volId,
        outcome: 'waitlisted',
        score: score?.total ?? null,
        score_breakdown: score ? { L: score.L, P: score.P } : null,
        waitlist_position: i + 1,
        exclusion_reason: null,
      })
    }

    for (const volId of excludedIds) {
      outcomes.push({
        run_id: run.id,
        volunteer_id: volId,
        outcome: 'excluded',
        score: null,
        score_breakdown: null,
        waitlist_position: null,
        exclusion_reason: 'mandatory_skills',
      })
    }

    if (outcomes.length > 0) {
      const { error: outErr } = await supabase
        .from('allocation_outcomes')
        .insert(outcomes)

      if (outErr) {
        return { data: null, error: toAppError(outErr) }
      }
    }

    if (!isDryRun) {
      const volToRegId = new Map(regs.map((r) => [r.volunteer_id, r.id]))

      for (const volId of result.selected) {
        const regId = volToRegId.get(volId)
        const score = scoreMap.get(volId)
        if (regId) {
          await supabase
            .from('registrations')
            .update({
              status: 'selected',
              priority_score: score?.total ?? null,
            })
            .eq('id', regId)
        }
      }

      for (let i = 0; i < result.waitlisted.length; i++) {
        const volId = result.waitlisted[i]!
        const regId = volToRegId.get(volId)
        const score = scoreMap.get(volId)
        if (regId) {
          await supabase
            .from('registrations')
            .update({
              status: 'waitlisted',
              priority_score: score?.total ?? null,
              waitlist_position: i + 1,
            })
            .eq('id', regId)
        }
      }
    }

    return { data: run, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getAllocationHistory(
  opportunityId: string
): Promise<Result<AllocationRun[]>> {
  try {
    const { data, error } = await supabase
      .from('allocation_runs')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('run_at', { ascending: false })

    if (error) return { data: null, error: toAppError(error) }
    return { data: (data as AllocationRun[]) ?? [], error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

export async function getAllocationOutcomes(
  runId: string
): Promise<Result<AllocationOutcome[]>> {
  try {
    const { data, error } = await supabase
      .from('allocation_outcomes')
      .select('*')
      .eq('run_id', runId)
      .order('outcome', { ascending: true })

    if (error) return { data: null, error: toAppError(error) }
    return { data: (data as AllocationOutcome[]) ?? [], error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
