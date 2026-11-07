import { View, Text, FlatList, type ListRenderItem } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOpportunities, useRegisterInterest } from '@/hooks/useOpportunities'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { LevelBadge } from '@/components/gamification/LevelBadge'
import { StreakFlame } from '@/components/gamification/StreakFlame'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCallback } from 'react'
import type { Opportunity } from '@/types'

const ITEM_HEIGHT = 220

function HomeSkeleton() {
  return (
    <View className="gap-3 px-4">
      <Skeleton height={24} className="w-48" />
      <Skeleton height={ITEM_HEIGHT} className="w-full" />
      <Skeleton height={ITEM_HEIGHT} className="w-full" />
      <Skeleton height={ITEM_HEIGHT} className="w-full" />
    </View>
  )
}

export default function HomeScreen() {
  const volunteer = useAuthStore(selectVolunteer)
  const { data: opportunities, isLoading } = useOpportunities()
  const registerMutation = useRegisterInterest()

  const handleRegister = useCallback(
    (id: string) => {
      registerMutation.mutate(id)
    },
    [registerMutation]
  )

  const renderItem: ListRenderItem<Opportunity> = useCallback(
    ({ item }) => (
      <OpportunityCard
        opportunity={item}
        onRegister={handleRegister}
        isRegistering={registerMutation.isPending && registerMutation.variables === item.id}
      />
    ),
    [handleRegister, registerMutation.isPending, registerMutation.variables]
  )

  const getItemLayout = useCallback(
    (_: ArrayLike<Opportunity> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  )

  const ListHeader = (
    <View className="px-4 pt-4 pb-3">
      <View className="flex-row items-center justify-between mb-1">
        <View>
          <Text className="text-muted text-sm">Welcome back</Text>
          <Text className="text-white font-bold text-xl">
            {volunteer?.full_name.split(' ')[0] ?? 'Volunteer'}
          </Text>
        </View>
        <View className="gap-2 items-end">
          {volunteer && <LevelBadge points={volunteer.total_points} />}
          {volunteer && <StreakFlame months={volunteer.streak_months} />}
        </View>
      </View>
      <Text className="text-gold font-semibold text-sm mt-3 mb-1">Upcoming opportunities</Text>
    </View>
  )

  if (isLoading) return <HomeSkeleton />

  const visibleOpportunities = (opportunities ?? []).slice(0, 6)

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <FlatList
        data={visibleOpportunities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16 px-4">
            <View
              className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4"
            >
              <Text className="text-2xl">📅</Text>
            </View>
            <Text className="text-white font-semibold text-base text-center mb-2">
              No opportunities right now
            </Text>
            <Text className="text-muted text-sm text-center">
              Check back soon! New volunteering events are added regularly.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}
