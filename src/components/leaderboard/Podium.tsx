import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { getInitials } from '@/utils'
import { COLORS } from '@/constants/theme'
import type { LeaderboardEntry } from '@/types'

interface PodiumProps {
  top3: LeaderboardEntry[]
}

const PODIUM_CONFIG = [
  { medal: '👑', height: 88, avatarSize: 56, color: '#F5B800', glow: '#F5B80030', rank: '1st' },
  { medal: '🥈', height: 68, avatarSize: 48, color: '#9CA3AF', glow: '#9CA3AF20', rank: '2nd' },
  { medal: '🥉', height: 52, avatarSize: 48, color: '#CD7F32', glow: '#CD7F3220', rank: '3rd' },
] as const

const PodiumSlot = memo(function PodiumSlot({
  entry,
  rank,
}: {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
}) {
  const cfg = PODIUM_CONFIG[rank - 1]!
  const isGold = rank === 1

  return (
    <View style={{ flex: 1, maxWidth: 140, alignItems: 'center' }}>
      {/* Medal/Crown above avatar */}
      <Text style={{ fontSize: isGold ? 22 : 16, marginBottom: 4 }}>{cfg.medal}</Text>

      {/* Avatar with glow ring */}
      <View
        style={{
          width: cfg.avatarSize + 8,
          height: cfg.avatarSize + 8,
          borderRadius: (cfg.avatarSize + 8) / 2,
          backgroundColor: cfg.glow,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <View
          style={{
            width: cfg.avatarSize,
            height: cfg.avatarSize,
            borderRadius: cfg.avatarSize / 2,
            backgroundColor: cfg.color + '20',
            borderWidth: 2.5,
            borderColor: cfg.color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: isGold ? 18 : 15 }}>
            {getInitials(entry.full_name)}
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text
        style={{ color: COLORS.white, fontWeight: '700', fontSize: 13, textAlign: 'center', marginBottom: 2 }}
        numberOfLines={1}
      >
        {entry.full_name.split(' ')[0]}
      </Text>

      {/* Points */}
      <Text style={{ color: cfg.color, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
        {entry.total_points.toLocaleString()} pts
      </Text>

      {/* Streak indicator */}
      {entry.streak_months > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 6 }}>
          <Text style={{ fontSize: 10 }}>🔥</Text>
          <Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: '600' }}>{entry.streak_months}mo</Text>
        </View>
      )}

      {/* Podium pillar */}
      <View
        style={{
          width: '100%',
          height: cfg.height,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          backgroundColor: cfg.color + '12',
          borderTopWidth: 3,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: cfg.color + '40',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: cfg.color, fontWeight: '900', fontSize: isGold ? 28 : 22, opacity: 0.3 }}>
          {cfg.rank}
        </Text>
      </View>
    </View>
  )
})

export function Podium({ top3 }: PodiumProps) {
  const [gold, silver, bronze] = top3
  if (!gold) return null

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Section label */}
      <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 14 }}>
        TOP VOLUNTEERS
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
        {silver && <PodiumSlot entry={silver} rank={2} />}
        <PodiumSlot entry={gold} rank={1} />
        {bronze && <PodiumSlot entry={bronze} rank={3} />}
      </View>
    </View>
  )
}
