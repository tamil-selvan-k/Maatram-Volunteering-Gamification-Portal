/**
 * QR code payload generation & verification — supports two modes:
 *
 *   "rotating" — TOTP-style, rotates every 5 minutes (anti-screenshot).
 *                Requires admin to keep a phone displaying the QR at the venue.
 *
 *   "static"  — Fixed QR that never changes. Can be printed and pasted at the
 *                gate so no one needs to stand there. Less secure but practical.
 *
 * Uses Web Crypto API (available in React Native Hermes ≥ 0.71).
 */

export type QRMode = 'rotating' | 'static'

/** Current TOTP window index (5-minute bucket). */
function currentWindow(): number {
  return Math.floor(Date.now() / 1000 / 300)
}

/** Encode a Uint8Array to lowercase hex. */
function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** SHA-256 via Web Crypto API. */
async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  return toHex(hashBuf)
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface QRPayload {
  event_id: string
  mode: QRMode
  window: number
  hmac: string
}

/**
 * Generate a base64-encoded QR payload.
 * In "static" mode, window is always 0 and the hash is time-independent.
 */
export async function generateQRPayload(
  eventId: string,
  secret: string,
  mode: QRMode = 'rotating'
): Promise<string> {
  const win = mode === 'static' ? 0 : currentWindow()
  const hmac = await sha256(`${secret}|${eventId}|${mode}|${win}`)
  const payload: QRPayload = { event_id: eventId, mode, window: win, hmac }
  return btoa(JSON.stringify(payload))
}

/**
 * Verify a scanned QR payload.
 * Static payloads are always valid (no time check).
 * Rotating payloads accept ±1 window for clock-skew tolerance.
 */
export async function verifyQRPayload(
  rawPayload: string,
  eventId: string,
  secret: string
): Promise<{ valid: boolean; windowDrift: number }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(atob(rawPayload))
  } catch {
    return { valid: false, windowDrift: 0 }
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('event_id' in parsed) ||
    !('hmac' in parsed)
  ) {
    return { valid: false, windowDrift: 0 }
  }

  const p = parsed as QRPayload

  if (p.event_id !== eventId) return { valid: false, windowDrift: 0 }

  const mode: QRMode = p.mode ?? 'rotating'

  if (mode === 'static') {
    const expectedHmac = await sha256(`${secret}|${eventId}|static|0`)
    return { valid: expectedHmac === p.hmac, windowDrift: 0 }
  }

  const win = currentWindow()
  for (const drift of [0, 1, -1] as const) {
    const expectedHmac = await sha256(`${secret}|${eventId}|rotating|${win + drift}`)
    if (expectedHmac === p.hmac) {
      return { valid: true, windowDrift: drift }
    }
  }

  return { valid: false, windowDrift: 0 }
}
