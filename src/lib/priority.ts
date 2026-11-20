/**
 * Priority allocation algorithm for Maatram volunteering opportunities.
 *
 * Phase 2: Simplified to operational metrics only.
 * Score = L (reliability) + P (preference/skill match)
 *
 * Fairness factors (newcomer boost, diversity gap, recency, frustration)
 * have been removed per the audit direction. Fairness is measured and
 * reported, not used as a score.
 */

import type { ActivityType } from '@/types'

// ─── Input types ─────────────────────────────────────────────────────────────

export interface VolunteerProfile {
  id: string
  createdAt: string
  preferences: ActivityType[]
  skills: string[]
  timesSelected: number
  timesCompleted: number
}

export interface OpportunityProfile {
  activityType: ActivityType
  requiredSkills: string[]
  mandatorySkills: string[]
  totalSlots: number
}

export interface ScoreBreakdown {
  L: number
  P: number
  total: number
  volunteerId: string
}

export interface AllocationResult {
  selected: string[]
  waitlisted: string[]
  remainingSlots: number
  sendSecondNotification: boolean
}

export interface DetailedAllocationResult {
  selected: string[]
  waitlisted: string[]
  remainingSlots: number
  sendSecondNotification: boolean
  scores: ScoreBreakdown[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return Math.abs(hash)
}

// ─── Score components ────────────────────────────────────────────────────────

function reliabilityScore(timesSelected: number, timesCompleted: number): number {
  if (timesSelected === 0) return 20
  const rate = timesCompleted / timesSelected
  if (rate >= 0.9) return 20
  if (rate >= 0.7) return 0
  if (rate >= 0.5) return -20
  return -50
}

function preferenceMatch(vol: VolunteerProfile, opp: OpportunityProfile): number {
  const prefScore = vol.preferences.includes(opp.activityType) ? 10 : 0
  const skillScore =
    opp.requiredSkills.length === 0
      ? 15
      : (vol.skills.filter((s) => opp.requiredSkills.includes(s)).length /
          opp.requiredSkills.length) *
        15
  return prefScore + skillScore
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computePriorityScore(
  vol: VolunteerProfile,
  opp: OpportunityProfile
): ScoreBreakdown {
  const L = reliabilityScore(vol.timesSelected, vol.timesCompleted)
  const P = preferenceMatch(vol, opp)
  return { L, P, total: L + P, volunteerId: vol.id }
}

export function allocateOpportunity(
  opp: OpportunityProfile,
  applicants: VolunteerProfile[],
  seed?: string
): DetailedAllocationResult {
  const allocationSeed = seed ?? Date.now().toString()

  const eligible = applicants.filter((v) =>
    opp.mandatorySkills.every((s) => v.skills.includes(s))
  )

  const scored = eligible.map((v) => computePriorityScore(v, opp))

  if (eligible.length <= opp.totalSlots) {
    return {
      selected: eligible.map((v) => v.id),
      waitlisted: [],
      remainingSlots: opp.totalSlots - eligible.length,
      sendSecondNotification: eligible.length < opp.totalSlots,
      scores: scored,
    }
  }

  scored.sort((a, b) => {
    const scoreDiff = b.total - a.total
    if (Math.abs(scoreDiff) > 0.001) return scoreDiff
    const hashA = hashCode(allocationSeed + a.volunteerId) % 1000
    const hashB = hashCode(allocationSeed + b.volunteerId) % 1000
    return hashB - hashA
  })

  return {
    selected: scored.slice(0, opp.totalSlots).map((s) => s.volunteerId),
    waitlisted: scored.slice(opp.totalSlots).map((s) => s.volunteerId),
    remainingSlots: 0,
    sendSecondNotification: false,
    scores: scored,
  }
}

// ─── Availability-aware eligibility filter ──────────────────────────────────

export interface EligibilityInput {
  volunteer: VolunteerProfile
  isAvailable: boolean
  modeCompatible: boolean
}

export function filterEligible(
  _opp: OpportunityProfile,
  inputs: EligibilityInput[]
): { eligible: VolunteerProfile[]; excluded: { volunteerId: string; reason: string }[] } {
  const eligible: VolunteerProfile[] = []
  const excluded: { volunteerId: string; reason: string }[] = []

  for (const input of inputs) {
    if (!input.isAvailable) {
      excluded.push({ volunteerId: input.volunteer.id, reason: 'not_available' })
    } else if (!input.modeCompatible) {
      excluded.push({ volunteerId: input.volunteer.id, reason: 'mode_incompatible' })
    } else {
      eligible.push(input.volunteer)
    }
  }

  return { eligible, excluded }
}
