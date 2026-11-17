import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { getInitials } from '@/utils'
import { COLORS } from '@/constants/theme'
import type { LeaderboardEntry } from '@/types'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
}

function RankBadge({ rank }: { rank: number }) {
  const isTop10 = rank <= 10
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: isTop10 ? `${COLORS.gold}15` : COLORS.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: isTop10 ? COLORS.gold : COLORS.muted,
          fontWeight: '800',
          fontSize: 12,
        }}
      >
        {rank}
      </Text>
    </View>
  )
}

export const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  isCurrentUser = false,
}: LeaderboardRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 14,
        marginBottom: 8,
        backgroundColor: isCurrentUser ? `${COLORS.gold}10` : COLORS.surface,
        borderWidth: 1,
        borderColor: isCurrentUser ? `${COLORS.gold}30` : COLORS.border,
      }}
    >
      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isCurrentUser ? `${COLORS.gold}20` : COLORS.surfaceElevated,
          borderWidth: isCurrentUser ? 1.5 : 0,
          borderColor: `${COLORS.gold}50`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 13 }}>
          {getInitials(entry.full_name)}
        </Text>
      </View>

      {/* Name + stats */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
            {entry.full_name}
          </Text>
          {isCurrentUser && (
            <View
              style={{
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 4,
                backgroundColor: `${COLORS.gold}25`,
              }}
            >
              <Text style={{ color: COLORS.gold, fontSize: 9, fontWeight: '700' }}>YOU</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 11 }}>
            {entry.total_events} events
          </Text>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.muted, opacity: 0.4 }} />
          <Text style={{ color: COLORS.muted, fontSize: 11 }}>
            {entry.total_hours.toFixed(0)}h
          </Text>
          {entry.streak_months > 0 && (
            <>
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.muted, opacity: 0.4 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 10 }}>🔥</Text>
                <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '600' }}>
                  {entry.streak_months}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Points + level */}
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 14 }}>
          {entry.total_points.toLocaleString()}
        </Text>
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: `${COLORS.gold}10`,
            borderWidth: 1,
            borderColor: `${COLORS.gold}20`,
          }}
        >
          <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700' }}>
            Lv.{entry.level}
          </Text>
        </View>
      </View>
    </View>
  )
})
