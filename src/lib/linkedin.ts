import * as Linking from 'expo-linking'
import { getLevelInfo } from '@/utils'
import type { Volunteer } from '@/types'

/**
 * Returns true if the volunteer has opted in to LinkedIn sharing and is at least level 3.
 */
export function canShareToLinkedIn(volunteer: Volunteer): boolean {
  return volunteer.consent_linkedin && volunteer.level >= 3
}

/**
 * Builds a LinkedIn share URL.
 *
 * LinkedIn's share-offsite endpoint only supports the `url` parameter.
 * The shared page's Open Graph meta tags control the preview card.
 */
export function generateLinkedInShareUrl(volunteer: Volunteer): string {
  const levelInfo = getLevelInfo(volunteer.total_points)

  const profileUrl = new URL(`https://maatram.org/volunteer/${volunteer.id}`)
  profileUrl.searchParams.set('level', String(levelInfo.level))
  profileUrl.searchParams.set('points', String(volunteer.total_points))
  profileUrl.searchParams.set('completed', String(volunteer.times_completed))

  const params = new URLSearchParams({ url: profileUrl.toString() })
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`
}

/**
 * Opens the LinkedIn share dialog in the browser / LinkedIn app.
 */
export async function shareToLinkedIn(volunteer: Volunteer): Promise<void> {
  const url = generateLinkedInShareUrl(volunteer)
  await Linking.openURL(url)
}
