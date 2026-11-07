import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { getInitials } from '@/utils'
import { LevelBadge } from '@/components/gamification/LevelBadge'
import type { LeaderboardEntry } from '@/types'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
}

export const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  isCurrentUser = false,
}: LeaderboardRowProps) {
  return (
    <View
      className={`flex-row items-center gap-3 p-3 rounded-xl mb-2 ${
        isCurrentUser
          ? 'bg-gold/10 border border-gold/30'
          : 'bg-surface border border-border'
      }`}
    >
      <Text className="text-muted font-bold text-sm w-7 text-center">{entry.rank}</Text>
      <View className="w-9 h-9 rounded-full bg-surface-elevated items-center justify-center">
        <Text className="text-white font-bold text-xs">{getInitials(entry.full_name)}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
          {entry.full_name}
          {isCurrentUser && <Text className="text-gold"> (you)</Text>}
        </Text>
        <Text className="text-muted text-xs">
          {entry.total_events} events · {entry.total_hours.toFixed(0)}h
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text className="text-gold font-bold text-sm">{entry.total_points.toLocaleString()}</Text>
        <LevelBadge points={entry.total_points} size="sm" />
      </View>
    </View>
  )
})
