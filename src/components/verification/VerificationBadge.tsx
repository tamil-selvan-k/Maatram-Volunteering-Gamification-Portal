import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { Shield, ShieldCheck, ShieldAlert, Star } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import { VERIFICATION_MULTIPLIERS } from '@/utils/verification'
import type { VerificationLevel } from '@/types'

// ─── Level config ─────────────────────────────────────────────────────────────

interface LevelConfig {
  label: string
  color: string
  bgColor: string
  Icon: typeof Shield
  glow?: boolean
}

const LEVEL_CONFIGS: Record<VerificationLevel, LevelConfig> = {
  self_report:   { label: 'Self Report',    color: COLORS.muted,    bgColor: '#2A2A30', Icon: ShieldAlert },
  photo_pending: { label: 'Photo Pending',  color: COLORS.warning,  bgColor: '#2A1A0A', Icon: Shield },
  qr_partial:    { label: 'QR Check-in',    color: '#60A5FA',       bgColor: '#0A1A2A', Icon: ShieldCheck },
  peer_partial:  { label: 'Peer Verified',  color: '#A78BFA',       bgColor: '#1A0A2A', Icon: ShieldCheck },
  qr_full:       { label: 'QR Verified',    color: COLORS.success,  bgColor: '#0A1F14', Icon: ShieldCheck },
  qr_peer:       { label: 'QR + Peers',     color: COLORS.success,  bgColor: '#0A1F14', Icon: ShieldCheck },
  gold_standard: { label: 'Gold Standard',  color: COLORS.gold,     bgColor: '#1A1300', Icon: Star, glow: true },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VerificationBadgeProps {
  level: VerificationLevel
  size?: 'sm' | 'md' | 'lg'
}

export const VerificationBadge = memo(function VerificationBadge({
  level,
  size = 'md',
}: VerificationBadgeProps) {
  const config = LEVEL_CONFIGS[level]
  const multiplier = VERIFICATION_MULTIPLIERS[level]

  const iconSize   = size === 'sm' ? 12 : size === 'md' ? 14 : 18
  const textSize   = size === 'sm' ? 10 : size === 'md' ? 12 : 14
  const multSize   = size === 'sm' ? 9  : size === 'md' ? 11 : 13
  const padH       = size === 'sm' ? 8  : size === 'md' ? 10 : 14
  const padV       = size === 'sm' ? 4  : size === 'md' ? 6  : 8

  const { Icon } = config

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: config.bgColor,
        borderWidth: 1,
        borderColor: config.color + '40',
        borderRadius: 999,
        paddingHorizontal: padH,
        paddingVertical: padV,
        // Gold glow shadow
        ...(config.glow
          ? {
              shadowColor: COLORS.gold,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
              elevation: 6,
            }
          : {}),
      }}
    >
      <Icon size={iconSize} color={config.color} />
      <Text
        style={{
          color: config.color,
          fontSize: textSize,
          fontWeight: '600',
        }}
      >
        {config.label}
      </Text>
      <View
        style={{
          backgroundColor: config.color + '20',
          borderRadius: 999,
          paddingHorizontal: 5,
          paddingVertical: 2,
        }}
      >
        <Text
          style={{
            color: config.color,
            fontSize: multSize,
            fontWeight: '700',
          }}
        >
          {multiplier.toFixed(2)}x
        </Text>
      </View>
    </View>
  )
})
