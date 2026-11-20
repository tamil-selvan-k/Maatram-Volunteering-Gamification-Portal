import { computePriorityScore } from '@/lib/priority'
import type { VolunteerProfile, OpportunityProfile } from '@/lib/priority'
import type { ActivityType } from '@/types'

export interface BatchOpportunity {
  id: string
  activityType: ActivityType
  requiredSkills: string[]
  mandatorySkills: string[]
  totalSlots: number
  filledSlots: number
  priority: number
  eventDate: string
  durationHours: number
  mode: 'online' | 'offline'
}

export interface BatchVolunteer {
  id: string
  skills: string[]
  preferences: ActivityType[]
  timesSelected: number
  timesCompleted: number
  maxWeeklyHours: number | null
  assignedHours: number
  assignedOpportunityIds: string[]
}

export interface BatchAllocationResult {
  assignments: Array<{
    opportunityId: string
    volunteerId: string
    score: number
  }>
  unfilledSlots: Array<{
    opportunityId: string
    remaining: number
  }>
  conflicts: Array<{
    volunteerId: string
    opportunityId: string
    reason: string
  }>
}

function timeWindowsOverlap(
  dateA: string,
  durationA: number,
  dateB: string,
  durationB: number
): boolean {
  const startA = new Date(dateA).getTime()
  const startB = new Date(dateB).getTime()
  if (isNaN(startA) || isNaN(startB)) return false
  const endA = startA + durationA * 3600_000
  const endB = startB + durationB * 3600_000
  return startA < endB && startB < endA
}

function hasScheduleConflict(
  volunteer: BatchVolunteer,
  opportunity: BatchOpportunity,
  allOpportunities: Map<string, BatchOpportunity>
): boolean {
  for (const assignedId of volunteer.assignedOpportunityIds) {
    const assigned = allOpportunities.get(assignedId)
    if (!assigned) continue
    if (
      timeWindowsOverlap(
        assigned.eventDate,
        assigned.durationHours,
        opportunity.eventDate,
        opportunity.durationHours
      )
    ) {
      return true
    }
  }
  return false
}

function hasMandatorySkills(volunteer: BatchVolunteer, opportunity: BatchOpportunity): boolean {
  return opportunity.mandatorySkills.every((s) => volunteer.skills.includes(s))
}

function exceedsWeeklyHours(volunteer: BatchVolunteer, durationHours: number): boolean {
  if (volunteer.maxWeeklyHours === null) return false
  return volunteer.assignedHours + durationHours > volunteer.maxWeeklyHours
}

export function runBatchMatching(
  opportunities: BatchOpportunity[],
  volunteers: BatchVolunteer[],
  registrations: Map<string, string[]>
): BatchAllocationResult {
  const sorted = [...opportunities].sort((a, b) => {
    const priorityDiff = a.priority - b.priority
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  })

  const oppMap = new Map(opportunities.map((o) => [o.id, o]))
  const volMap = new Map(volunteers.map((v) => [v.id, { ...v }]))

  const assignments: BatchAllocationResult['assignments'] = []
  const unfilledSlots: BatchAllocationResult['unfilledSlots'] = []
  const conflictsSet = new Map<string, string>()

  for (const opp of sorted) {
    const availableSlots = opp.totalSlots - opp.filledSlots
    if (availableSlots <= 0) continue

    const registeredVolunteerIds = [...new Set(registrations.get(opp.id) ?? [])]

    const oppProfile: OpportunityProfile = {
      activityType: opp.activityType,
      requiredSkills: opp.requiredSkills,
      mandatorySkills: opp.mandatorySkills,
      totalSlots: availableSlots,
    }

    const oppDateInvalid = isNaN(new Date(opp.eventDate).getTime())
    const eligible: Array<{ vol: BatchVolunteer; profile: VolunteerProfile }> = []

    for (const volId of registeredVolunteerIds) {
      const vol = volMap.get(volId)
      if (!vol) continue

      if (oppDateInvalid) {
        conflictsSet.set(
          `${volId}:${opp.id}:invalidDate`,
          `Invalid event date for opportunity ${opp.id}`
        )
      }

      if (!hasMandatorySkills(vol, opp)) {
        conflictsSet.set(`${volId}:${opp.id}:skills`, `Missing mandatory skills for opportunity ${opp.id}`)
        continue
      }

      if (hasScheduleConflict(vol, opp, oppMap)) {
        conflictsSet.set(`${volId}:${opp.id}:schedule`, `Schedule conflict for opportunity ${opp.id}`)
        continue
      }

      if (exceedsWeeklyHours(vol, opp.durationHours)) {
        conflictsSet.set(`${volId}:${opp.id}:hours`, `Would exceed weekly hour limit for opportunity ${opp.id}`)
        continue
      }

      const profile: VolunteerProfile = {
        id: vol.id,
        createdAt: new Date(0).toISOString(),
        preferences: vol.preferences,
        skills: vol.skills,
        timesSelected: vol.timesSelected,
        timesCompleted: vol.timesCompleted,
      }
      eligible.push({ vol, profile })
    }

    const scored = eligible.map(({ vol, profile }) => ({
      vol,
      score: computePriorityScore(profile, oppProfile),
    }))

    scored.sort((a, b) => {
      const diff = b.score.total - a.score.total
      if (Math.abs(diff) > 0.001) return diff
      return a.vol.id.localeCompare(b.vol.id)
    })

    const toAssign = scored.slice(0, availableSlots)
    const assignedThisOpp = new Set<string>()

    for (const { vol, score } of toAssign) {
      if (assignedThisOpp.has(vol.id)) continue
      assignedThisOpp.add(vol.id)

      assignments.push({
        opportunityId: opp.id,
        volunteerId: vol.id,
        score: score.total,
      })

      const mutableVol = volMap.get(vol.id)!
      mutableVol.assignedHours += opp.durationHours
      mutableVol.assignedOpportunityIds = [...mutableVol.assignedOpportunityIds, opp.id]
    }

    const remaining = availableSlots - toAssign.length
    if (remaining > 0) {
      unfilledSlots.push({ opportunityId: opp.id, remaining })
    }
  }

  const conflicts: BatchAllocationResult['conflicts'] = []
  const seenConflicts = new Set<string>()
  for (const [key, reason] of conflictsSet) {
    const parts = key.split(':')
    const volunteerId = parts[0]!
    const opportunityId = parts[1]!
    const dedupeKey = `${volunteerId}:${opportunityId}`
    if (!seenConflicts.has(dedupeKey)) {
      seenConflicts.add(dedupeKey)
      conflicts.push({ volunteerId, opportunityId, reason })
    }
  }

  return { assignments, unfilledSlots, conflicts }
}
