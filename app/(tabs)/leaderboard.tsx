import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, type ListRenderItem } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLeaderboard, useBadges } from '@/hooks/useLeaderboard'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { Podium } from '@/components/leaderboard/Podium'
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { COLORS } from '@/constants/theme'
import { getLevelInfo, getLevelProgress } from '@/utils'
import type { LeaderboardEntry } from '@/types'

type Period = 'month' | 'quarter' | 'all'

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'This Month', value: 'month' },
  { label: 'Quarter',    value: 'quarter' },
  { label: 'All Time',   value: 'all' },
]

function StatChip({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: `${color}08`,
        borderWidth: 1,
        borderColor: `${color}18`,
        gap: 2,
      }}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ color, fontWeight: '800', fontSize: 14 }}>{value}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  )
}

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>('month')
  const { data: entries, isLoading } = useLeaderboard(period)
  const volunteer = useAuthStore(selectVolunteer)
  const { data: earnedBadges = [] } = useBadges(volunteer?.id)

  const top3  = (entries ?? []).slice(0, 3)
  const rest  = (entries ?? []).slice(3)

  const myEntry = (entries ?? []).find((e) => e.id === volunteer?.id)
  const points = volunteer?.total_points ?? 0
  const streakMonths = volunteer?.streak_months ?? 0
  const levelInfo = getLevelInfo(points)
  const levelProgress = getLevelProgress(points)

  const renderRow: ListRenderItem<LeaderboardEntry> = useCallback(
    ({ item }) => (
      <LeaderboardRow
        entry={item}
        isCurrentUser={item.id === volunteer?.id}
      />
    ),
    [volunteer?.id]
  )

  const ListHeader = (
    <View>
      {/* Period tabs */}
      <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 12 }}>
        {PERIOD_OPTIONS.map((opt) => {
          const active = period === opt.value
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setPeriod(opt.value)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: active ? `${COLORS.gold}15` : COLORS.surface,
                borderWidth: 1,
                borderColor: active ? `${COLORS.gold}50` : COLORS.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: active ? COLORS.gold : COLORS.muted,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Your standing card */}
      {volunteer && (
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: myEntry ? `${COLORS.gold}30` : COLORS.border,
            borderRadius: 18,
            padding: 16,
            marginBottom: 18,
          }}
        >
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>📊</Text>
              <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>
                Your Standing
              </Text>
            </View>
            {myEntry ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: `${COLORS.gold}18`,
                  borderWidth: 1,
                  borderColor: `${COLORS.gold}35`,
                }}
              >
                <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '800' }}>
                  #{myEntry.rank}
                </Text>
              </View>
            ) : (
              <Text style={{ color: COLORS.muted, fontSize: 11 }}>Not ranked yet</Text>
            )}
          </View>

          {/* Level progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${COLORS.gold}15`,
                borderWidth: 2,
                borderColor: `${COLORS.gold}40`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 16 }}>
                {levelInfo.level}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '800' }}>
                    {points.toLocaleString()}
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>pts</Text>
                </View>
                <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '600' }}>
                  {levelInfo.name}
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceElevated, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.max(Math.round(levelProgress * 100), 2)}%`,
                    backgroundColor: COLORS.gold,
                    borderRadius: 3,
                  }}
                />
              </View>
              {levelInfo.maxPoints !== Infinity && (
                <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 3, textAlign: 'right' }}>
                  {(levelInfo.maxPoints - points).toLocaleString()} pts to Lv.{levelInfo.level + 1}
                </Text>
              )}
            </View>
          </View>

          {/* Stat chips */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatChip icon="🔥" value={`${streakMonths}mo`} label="STREAK" color="#F97316" />
            <StatChip icon="🏅" value={String(earnedBadges.length)} label="BADGES" color={COLORS.gold} />
            <StatChip icon="✅" value={String(volunteer.times_completed)} label="COMPLETED" color={COLORS.success} />
          </View>
        </View>
      )}

      {/* Podium */}
      {top3.length > 0 && <Podium top3={top3} />}

      {/* Divider + section header */}
      {rest.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
          <View style={{ height: 1, flex: 1, backgroundColor: COLORS.border }} />
          <Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
            RANKINGS
          </Text>
          <View style={{ height: 1, flex: 1, backgroundColor: COLORS.border }} />
        </View>
      )}
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={48} />
          <Skeleton height={140} />
          <Skeleton height={200} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 20 }}>🏆</Text>
        <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 22 }}>Leaderboard</Text>
      </View>

      <FlatList
        data={rest}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          top3.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 28 }}>🏆</Text>
              </View>
              <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
                No rankings yet
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 }}>
                Be the first to volunteer! Complete a verified activity to appear on the leaderboard.
              </Text>
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  )
}
