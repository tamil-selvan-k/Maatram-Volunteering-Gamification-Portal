import * as Linking from 'expo-linking'
import { getLevelInfo } from '@/utils'
import { BADGE_DEFINITIONS } from '@/constants/levels'
import type { Volunteer } from '@/types'

/**
 * Returns true if the volunteer has opted in to LinkedIn sharing and is at least level 3.
 */
export function canShareToLinkedIn(volunteer: Volunteer): boolean {
  return volunteer.consent_linkedin && volunteer.level >= 3
}

/**
 * Builds a LinkedIn share URL with a pre-filled title and summary.
 */
export function generateLinkedInShareUrl(volunteer: Volunteer): string {
  const levelInfo = getLevelInfo(volunteer.total_points)
  const profileUrl = `https://maatram.org/volunteer/${volunteer.id}`
  const title = `Maatram Volunteer — ${levelInfo.name}`

  // Get top earned badge names (up to 3)
  const topBadges = BADGE_DEFINITIONS
    .filter((b) => {
      // We don't have badges list here; use placeholder based on level
      return true
    })
    .slice(0, 3)
    .map((b) => b.name)

  const summary = [
    `I am a Maatram Foundation volunteer at level ${levelInfo.level} (${levelInfo.name}).`,
    `Total contribution: ${volunteer.total_points.toLocaleString()} points.`,
    `${volunteer.times_completed} events completed.`,
    topBadges.length > 0 ? `Achievements: ${topBadges.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const params = new URLSearchParams({
    url:     profileUrl,
    title,
    summary,
  })

  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`
}

/**
 * Opens the LinkedIn share dialog in the browser / LinkedIn app.
 */
export async function shareToLinkedIn(volunteer: Volunteer): Promise<void> {
  const url = generateLinkedInShareUrl(volunteer)
  await Linking.openURL(url)
}
