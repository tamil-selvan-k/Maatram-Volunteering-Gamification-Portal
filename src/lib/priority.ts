/**
 * Priority allocation algorithm for Maatram volunteering opportunities.
 * Replaces first-come-first-served with a fairness-weighted system.
 *
 * Score = N (newcomer boost) + D (diversity gap) + R (recency) +
 *         F (frustration) + L (reliability) + P (preference match)
 *
 * Range: -50 to 375 (practical: 20–250 for active volunteers)
 */

import { ACTIVITY_WEIGHTS } from '@/constants/activities'
import type { ActivityType } from '@/types'

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CompletedActivity {
  type: ActivityType
  completedAt: string
}

export interface VolunteerProfile {
  id: string
  createdAt: string
  preferences: ActivityType[]
  skills: string[]
  consecutiveRejections: number
  timesSelected: number
  timesCompleted: number
  completedActivities: CompletedActivity[]
}

export interface OpportunityProfile {
  activityType: ActivityType
  requiredSkills: string[]
  mandatorySkills: string[]
  totalSlots: number
}

export interface ScoreBreakdown {
  N: number   // Newcomer boost        0–100
  D: number   // Diversity gap         0–90
  R: number   // Recency fairness      0–80
  F: number   // Frustration bonus     0–60
  L: number   // Reliability           -50–+20
  P: number   // Preference match      0–25
  total: number
  volunteerId: string
}

export interface AllocationResult {
  selected: string[]
  waitlisted: string[]
  remainingSlots: number
  sendSecondNotification: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NEWCOMER_THRESHOLD = 3
const RECENCY_CAP_DAYS = 90
const RECENCY_MAX_SCORE = 80
const FRUSTRATION_PER_REJECTION = 12
const MAX_FRUSTRATION = 60
const DIVERSITY_MULTIPLIER = 15

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 86_400_000
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ─── Score components ────────────────────────────────────────────────────────

function newcomerBoost(totalActivities: number): number {
  if (totalActivities === 0) return 100
  if (totalActivities <= NEWCOMER_THRESHOLD) return 80 - totalActivities * 15
  return 0
}

function diversityGap(vol: VolunteerProfile, opp: OpportunityProfile): number {
  const n = vol.completedActivities.length
  const avgWeight =
    n === 0
      ? 0
      : vol.completedActivities.reduce(
          (sum, a) => sum + (ACTIVITY_WEIGHTS[a.type] ?? 1),
          0
        ) / n
  const oppWeight = ACTIVITY_WEIGHTS[opp.activityType] ?? 1
  return Math.max(0, oppWeight - avgWeight) * DIVERSITY_MULTIPLIER
}

function recencyFairness(vol: VolunteerProfile): number {
  let daysSinceLast: number

  if (vol.completedActivities.length === 0) {
    daysSinceLast = clamp(
      daysBetween(new Date(vol.createdAt), new Date()),
      0,
      RECENCY_CAP_DAYS
    )
  } else {
    const mostRecent = vol.completedActivities.reduce((latest, a) =>
      new Date(a.completedAt) > new Date(latest.completedAt) ? a : latest
    )
    daysSinceLast = daysBetween(new Date(mostRecent.completedAt), new Date())
  }

  return clamp(daysSinceLast / RECENCY_CAP_DAYS, 0, 1) * RECENCY_MAX_SCORE
}

function frustrationBonus(consecutiveRejections: number): number {
  return clamp(consecutiveRejections * FRUSTRATION_PER_REJECTION, 0, MAX_FRUSTRATION)
}

function reliabilityScore(timesSelected: number, timesCompleted: number): number {
  if (timesSelected === 0) return 20 // benefit of the doubt
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

// ─── Public API ───────────────────────────────────────────────────────────────

export function computePriorityScore(
  vol: VolunteerProfile,
  opp: OpportunityProfile
): ScoreBreakdown {
  const N = newcomerBoost(vol.completedActivities.length)
  const D = diversityGap(vol, opp)
  const R = recencyFairness(vol)
  const F = frustrationBonus(vol.consecutiveRejections)
  const L = reliabilityScore(vol.timesSelected, vol.timesCompleted)
  const P = preferenceMatch(vol, opp)
  return { N, D, R, F, L, P, total: N + D + R + F + L + P, volunteerId: vol.id }
}

function tieBreak(
  a: ScoreBreakdown & { vol: VolunteerProfile },
  b: ScoreBreakdown & { vol: VolunteerProfile }
): number {
  if (a.vol.consecutiveRejections !== b.vol.consecutiveRejections)
    return b.vol.consecutiveRejections - a.vol.consecutiveRejections
  const aCount = a.vol.completedActivities.length
  const bCount = b.vol.completedActivities.length
  if (aCount !== bCount) return aCount - bCount
  const dateA = new Date(a.vol.createdAt).getTime()
  const dateB = new Date(b.vol.createdAt).getTime()
  if (dateA !== dateB) return dateA - dateB
  return Math.random() - 0.5
}

export function allocateOpportunity(
  opp: OpportunityProfile,
  applicants: VolunteerProfile[]
): AllocationResult {
  // Under-subscribed — accept all
  if (applicants.length <= opp.totalSlots) {
    return {
      selected: applicants.map((v) => v.id),
      waitlisted: [],
      remainingSlots: opp.totalSlots - applicants.length,
      sendSecondNotification: true,
    }
  }

  // Pre-filter: mandatory skills are hard requirements
  const eligible = applicants.filter((v) =>
    opp.mandatorySkills.every((s) => v.skills.includes(s))
  )

  const scored = eligible
    .map((v) => ({ ...computePriorityScore(v, opp), vol: v }))
    .sort((a, b) => {
      const scoreDiff = b.total - a.total
      return Math.abs(scoreDiff) > 1 ? scoreDiff : tieBreak(a, b)
    })

  return {
    selected: scored.slice(0, opp.totalSlots).map((s) => s.volunteerId),
    waitlisted: scored.slice(opp.totalSlots).map((s) => s.volunteerId),
    remainingSlots: 0,
    sendSecondNotification: false,
  }
}
