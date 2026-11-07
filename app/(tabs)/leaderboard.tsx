import { useCallback, useState } from 'react'
import { View, Text, FlatList, type ListRenderItem } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { Podium } from '@/components/leaderboard/Podium'
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow'
import { Skeleton } from '@/components/ui/Skeleton'
import type { LeaderboardEntry } from '@/types'

type Period = 'month' | 'quarter' | 'all'

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'This Month', value: 'month' },
  { label: 'Quarter',    value: 'quarter' },
  { label: 'All Time',   value: 'all' },
]

const ROW_HEIGHT = 72

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<Period>('month')
  const { data: entries, isLoading } = useLeaderboard()
  const volunteer = useAuthStore(selectVolunteer)

  const top3  = (entries ?? []).slice(0, 3)
  const rest  = (entries ?? []).slice(3)

  const renderRow: ListRenderItem<LeaderboardEntry> = useCallback(
    ({ item }) => (
      <LeaderboardRow
        entry={item}
        isCurrentUser={item.id === volunteer?.id}
      />
    ),
    [volunteer?.id]
  )

  const getItemLayout = useCallback(
    (_: ArrayLike<LeaderboardEntry> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    []
  )

  const ListHeader = (
    <View>
      {/* Period tabs */}
      <View className="flex-row gap-2 px-4 py-3">
        {PERIOD_OPTIONS.map((opt) => (
          <View
            key={opt.value}
            onTouchEnd={() => setPeriod(opt.value)}
            className={`flex-1 py-2 rounded-xl border items-center ${
              period === opt.value ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${period === opt.value ? 'text-gold' : 'text-muted'}`}>
              {opt.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Podium */}
      {top3.length > 0 && <Podium top3={top3} />}

      {/* Rank 4+ header */}
      {rest.length > 0 && (
        <View className="px-4 pb-2">
          <Text className="text-muted text-xs font-semibold uppercase tracking-wider">
            Rankings 4–50
          </Text>
        </View>
      )}
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="gap-3 p-4">
          <Skeleton height={160} />
          <Skeleton height={ROW_HEIGHT} />
          <Skeleton height={ROW_HEIGHT} />
          <Skeleton height={ROW_HEIGHT} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-0">
        <Text className="text-white font-bold text-xl">Leaderboard</Text>
      </View>
      <FlatList
        data={rest}
        renderItem={renderRow}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}
