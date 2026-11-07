import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { getInitials } from '@/utils'
import type { LeaderboardEntry } from '@/types'

interface PodiumProps {
  top3: LeaderboardEntry[]
}

const MEDALS = ['🥇', '🥈', '🥉'] as const
const HEIGHTS = [100, 75, 60] as const
const PODIUM_COLORS = ['#F5B800', '#9CA3AF', '#CD7F32'] as const

const PodiumSlot = memo(function PodiumSlot({
  entry,
  rank,
}: {
  entry: LeaderboardEntry
  rank: 1 | 2 | 3
}) {
  const idx = rank - 1
  const height = HEIGHTS[idx] ?? 60
  const color = PODIUM_COLORS[idx] ?? '#9CA3AF'
  const medal = MEDALS[idx] ?? '🏅'

  return (
    <View className="items-center gap-2" style={{ flex: 1 }}>
      {/* Avatar */}
      <View
        className="w-14 h-14 rounded-full items-center justify-center"
        style={{ backgroundColor: color + '25', borderWidth: 2, borderColor: color }}
      >
        <Text className="text-white font-bold text-base">{getInitials(entry.full_name)}</Text>
      </View>
      <Text className="text-white font-semibold text-xs text-center" numberOfLines={1}>
        {entry.full_name.split(' ')[0]}
      </Text>
      <Text className="text-xs" style={{ color }}>
        {entry.total_points.toLocaleString()} pts
      </Text>

      {/* Podium block */}
      <View
        className="w-full rounded-t-xl items-center justify-end pb-2"
        style={{ height, backgroundColor: color + '20', borderTopWidth: 2, borderColor: color }}
      >
        <Text style={{ fontSize: 20 }}>{medal}</Text>
      </View>
    </View>
  )
})

export function Podium({ top3 }: PodiumProps) {
  const [gold, silver, bronze] = top3
  if (!gold) return null

  return (
    <View className="flex-row items-end gap-2 px-4 mb-4">
      {silver && <PodiumSlot entry={silver} rank={2} />}
      <PodiumSlot entry={gold} rank={1} />
      {bronze && <PodiumSlot entry={bronze} rank={3} />}
    </View>
  )
}
