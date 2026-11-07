import React, { memo, useEffect, useState, useCallback } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { generateQRPayload } from '@/lib/qr'
import { COLORS } from '@/constants/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROTATION_SECONDS = 300 // 5 minutes

/** Seconds remaining until the next 5-minute boundary. */
function secondsUntilNextWindow(): number {
  const now = Math.floor(Date.now() / 1000)
  return ROTATION_SECONDS - (now % ROTATION_SECONDS)
}

/** Format as MM:SS. */
function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QRDisplayProps {
  eventId: string
  secret: string
  size?: number
}

export const QRDisplay = memo(function QRDisplay({
  eventId,
  secret,
  size = 240,
}: QRDisplayProps) {
  const [payload, setPayload] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(secondsUntilNextWindow)

  /** Regenerate the QR payload for the current window. */
  const regenerate = useCallback(() => {
    generateQRPayload(eventId, secret)
      .then((p) => setPayload(p))
      .catch((e: unknown) => console.error('[QRDisplay] generation error', e))
  }, [eventId, secret])

  // Generate on mount
  useEffect(() => {
    regenerate()
  }, [regenerate])

  // Countdown tick every second; regenerate on window boundary
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          regenerate()
          return secondsUntilNextWindow()
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [regenerate])

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      {/* QR Code */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          padding: 16,
          borderRadius: 16,
          shadowColor: COLORS.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {payload ? (
          <QRCode
            value={payload}
            size={size}
            color="#0D0D0F"
            backgroundColor="#FFFFFF"
          />
        ) : (
          <View
            style={{
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator color={COLORS.gold} size="large" />
          </View>
        )}
      </View>

      {/* Countdown */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: COLORS.surfaceElevated,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: countdown > 60 ? COLORS.success : COLORS.warning,
          }}
        />
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
          Rotates in{' '}
          <Text style={{ color: COLORS.white, fontWeight: '700' }}>
            {formatCountdown(countdown)}
          </Text>
        </Text>
      </View>

      {/* Hint */}
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 12,
          textAlign: 'center',
          maxWidth: 240,
        }}
      >
        Display this QR code at the venue. It rotates every 5 minutes to prevent
        screenshot sharing.
      </Text>
    </View>
  )
})
