import type { VerificationLevel } from '@/types'

// ─── Multipliers ─────────────────────────────────────────────────────────────

export const VERIFICATION_MULTIPLIERS: Record<VerificationLevel, number> = {
  self_report:   0.5,
  photo_pending: 0.7,
  qr_partial:    0.7,
  peer_partial:  0.8,
  qr_full:       1.0,
  qr_peer:       1.1,
  gold_standard: 1.25,
}

// ─── Level computation ───────────────────────────────────────────────────────

interface VerificationInput {
  checkin_time: string | null
  checkout_time: string | null
  photo_url: string | null
  peer_confirms: number
  admin_approved: boolean
}

/**
 * Pure function — determines the verification level from a Verification record.
 *
 * Upgrade path:
 *   no data           → self_report
 *   photo uploaded    → photo_pending
 *   QR check-in only  → qr_partial
 *   QR in + peers     → qr_peer
 *   QR in + out       → qr_full
 *   QR in/out + peers → qr_peer
 *   admin approved    → gold_standard
 *   peers only (≥2)   → peer_partial
 */
export function computeVerificationLevel(v: VerificationInput): VerificationLevel {
  const hasCheckin  = v.checkin_time !== null
  const hasCheckout = v.checkout_time !== null
  const hasPhoto    = v.photo_url !== null
  const hasPeers    = v.peer_confirms >= 2
  const hasQrFull   = hasCheckin && hasCheckout

  if (v.admin_approved) return 'gold_standard'
  if (hasQrFull && hasPeers) return 'qr_peer'
  if (hasQrFull) return 'qr_full'
  if (hasCheckin && hasPeers) return 'qr_peer'
  if (hasCheckin) return 'qr_partial'
  if (hasPeers) return 'peer_partial'
  if (hasPhoto) return 'photo_pending'
  return 'self_report'
}

// ─── Points computation ──────────────────────────────────────────────────────

/**
 * Compute final points awarded for an event.
 *
 * @param basePointsPerHour  Base point value per hour (from opportunity config)
 * @param verifiedHours      Hours verified (from checkout - checkin diff)
 * @param verificationLevel  Level achieved
 * @param bonusMultiplier    Optional extra multiplier (streak, first-time, etc.)
 */
export function computeFinalPoints(
  basePointsPerHour: number,
  verifiedHours: number,
  verificationLevel: VerificationLevel,
  bonusMultiplier = 1.0
): number {
  const verMultiplier = VERIFICATION_MULTIPLIERS[verificationLevel]
  return Math.round(basePointsPerHour * verifiedHours * verMultiplier * bonusMultiplier)
}
