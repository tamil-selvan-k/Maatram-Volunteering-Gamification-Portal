/**
 * TOTP-style rotating QR code payload generation & verification.
 *
 * DESIGN NOTE (hackathon simplification):
 *   Instead of full HMAC-SHA256 (which requires HMAC-SHA256(key, msg) =
 *   SHA256((key XOR opad) || SHA256((key XOR ipad) || msg))), we use:
 *
 *     token = SHA256(secret + "|" + eventId + "|" + windowTs)
 *
 *   This is a keyed hash (not strictly HMAC) but sufficient for the
 *   anti-spoofing goal of this hackathon demo.  For production, swap in a
 *   proper HMAC implementation via a backend edge-function.
 *
 * Rotation window: floor(unix_seconds / 300) — rotates every 5 minutes.
 * Grace period: ±1 window (allows ≤5 min clock skew between devices).
 *
 * Uses Web Crypto API (available in React Native Hermes ≥ 0.71).
 */

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
  window: number
  hmac: string
}

/**
 * Generate a base64-encoded QR payload for the current 5-minute window.
 */
export async function generateQRPayload(eventId: string, secret: string): Promise<string> {
  const win = currentWindow()
  const hmac = await sha256(`${secret}|${eventId}|${win}`)
  const payload: QRPayload = { event_id: eventId, window: win, hmac }
  return btoa(JSON.stringify(payload))
}

/**
 * Verify a scanned QR payload.
 * Accepts the current window and ±1 for clock-skew tolerance.
 *
 * @returns `{ valid, windowDrift }` — windowDrift is 0 for exact, ±1 for skew.
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
    !('window' in parsed) ||
    !('hmac' in parsed)
  ) {
    return { valid: false, windowDrift: 0 }
  }

  const p = parsed as QRPayload

  if (p.event_id !== eventId) return { valid: false, windowDrift: 0 }

  const win = currentWindow()

  for (const drift of [0, 1, -1] as const) {
    const expectedHmac = await sha256(`${secret}|${eventId}|${win + drift}`)
    if (expectedHmac === p.hmac) {
      return { valid: true, windowDrift: drift }
    }
  }

  return { valid: false, windowDrift: 0 }
}
