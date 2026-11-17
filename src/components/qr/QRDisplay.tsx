import React, { memo, useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { generateQRPayload, type QRMode } from '@/lib/qr'
import { COLORS } from '@/constants/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROTATION_SECONDS = 300 // 5 minutes

function secondsUntilNextWindow(): number {
  const now = Math.floor(Date.now() / 1000)
  return ROTATION_SECONDS - (now % ROTATION_SECONDS)
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface QRDisplayHandle {
  toDataURL: () => Promise<string | null>
}

interface QRDisplayProps {
  eventId: string
  secret: string
  mode: QRMode
  size?: number
}

export const QRDisplay = memo(forwardRef<QRDisplayHandle, QRDisplayProps>(function QRDisplay(
  { eventId, secret, mode, size = 240 },
  ref
) {
  const [payload, setPayload] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(secondsUntilNextWindow)
  const svgRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    toDataURL: () =>
      new Promise<string | null>((resolve) => {
        if (!svgRef.current?.toDataURL) {
          resolve(null)
          return
        }
        svgRef.current.toDataURL((data: string) => resolve(data))
      }),
  }))

  const regenerate = useCallback(() => {
    generateQRPayload(eventId, secret, mode)
      .then((p) => setPayload(p))
      .catch((e: unknown) => console.error('[QRDisplay] generation error', e))
  }, [eventId, secret, mode])

  useEffect(() => {
    regenerate()
  }, [regenerate])

  useEffect(() => {
    if (mode === 'static') return
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
  }, [regenerate, mode])

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
            getRef={(c: any) => { svgRef.current = c }}
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

      {/* Status badge */}
      {mode === 'rotating' ? (
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
      ) : (
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
              backgroundColor: COLORS.gold,
            }}
          />
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            Static — <Text style={{ color: COLORS.white, fontWeight: '700' }}>printable</Text>
          </Text>
        </View>
      )}

      {/* Hint */}
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 12,
          textAlign: 'center',
          maxWidth: 260,
        }}
      >
        {mode === 'rotating'
          ? 'Display this QR at the venue. It rotates every 5 minutes to prevent screenshot sharing.'
          : 'This QR never changes — print it and paste it at the venue gate. No need to stand there.'}
      </Text>
    </View>
  )
}))
