import React, { memo } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { COLORS } from '@/constants/theme'
import { BADGE_DEFINITIONS } from '@/constants/levels'
import { getLevelInfo } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { getVolunteerStats } from '@/services/volunteer.service'
import { getVolunteerBadges } from '@/services/volunteer.service'

interface ImpactSummaryProps {
  volunteerId: string
  totalPoints: number
}

export const ImpactSummary = memo(function ImpactSummary({
  volunteerId,
  totalPoints,
}: ImpactSummaryProps) {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['volunteer', 'stats', volunteerId],
    queryFn:  () => getVolunteerStats(volunteerId),
    select:   (r) => r.data,
    enabled:  !!volunteerId,
    staleTime: 60_000,
  })

  const { data: badgeTypes = [] } = useQuery({
    queryKey: ['volunteer', 'badges', volunteerId],
    queryFn:  () => getVolunteerBadges(volunteerId),
    select:   (r) => r.data ?? [],
    enabled:  !!volunteerId,
    staleTime: 60_000,
  })

  const levelInfo = getLevelInfo(totalPoints)

  // Top 3 earned badges
  const top3Badges = BADGE_DEFINITIONS
    .filter((b) => badgeTypes.includes(b.type))
    .slice(0, 3)

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
      }}
    >
      {/* Level badge + name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: `${COLORS.gold}20`,
            borderWidth: 2,
            borderColor: `${COLORS.gold}60`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 20 }}>
            {levelInfo.level}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 17 }}>
            {levelInfo.name}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
            {totalPoints.toLocaleString()} pts
          </Text>
        </View>
      </View>

      {/* Events + Hours */}
      {statsLoading ? (
        <ActivityIndicator size="small" color={COLORS.gold} style={{ marginBottom: 12 }} />
      ) : (
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 13,
            marginBottom: top3Badges.length > 0 ? 14 : 0,
          }}
        >
          {stats?.totalEvents ?? 0} events completed
          {' • '}
          {stats?.totalHours ?? 0} hrs volunteered
        </Text>
      )}

      {/* Top badges */}
      {top3Badges.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {top3Badges.map((badge) => (
            <View
              key={badge.type}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: `${badge.color}18`,
                borderWidth: 1,
                borderColor: `${badge.color}40`,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 12 }}>{badge.icon}</Text>
              <Text
                style={{
                  color: badge.color,
                  fontSize: 11,
                  fontWeight: '600',
                }}
              >
                {badge.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
})
