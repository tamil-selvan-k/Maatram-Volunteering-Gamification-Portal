import { useCallback, useState } from 'react'
import { View, Text, FlatList, ScrollView, type ListRenderItem } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOpportunities, useRegisterInterest } from '@/hooks/useOpportunities'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { ACTIVITY_LABELS } from '@/constants/activities'
import type { ActivityType, Opportunity, OpportunityFilters } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = [
  'physical_event',
  'physical_verification',
  'school_visit',
  'office_bg_work',
  'telephone_verification',
  'other_small_work',
]

const ITEM_HEIGHT = 220

export default function OpportunitiesScreen() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActivityType | null>(null)

  const filters: OpportunityFilters = {
    search: search || undefined,
    activityType: activeFilter,
  }

  const { data: opportunities, isLoading } = useOpportunities(filters)
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

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white font-bold text-xl mb-3">Browse Opportunities</Text>
        <Input
          placeholder="Search opportunities..."
          value={search}
          onChangeText={setSearch}
          className="mb-3"
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
      >
        <View
          onTouchEnd={() => setActiveFilter(null)}
          className={`px-3 py-1.5 rounded-full border ${
            activeFilter === null ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
          }`}
        >
          <Text className={`text-xs font-semibold ${activeFilter === null ? 'text-gold' : 'text-muted'}`}>
            All
          </Text>
        </View>
        {ACTIVITY_TYPES.map((type) => (
          <View
            key={type}
            onTouchEnd={() => setActiveFilter(activeFilter === type ? null : type)}
            className={`px-3 py-1.5 rounded-full border ${
              activeFilter === type ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${activeFilter === type ? 'text-gold' : 'text-muted'}`}>
              {ACTIVITY_LABELS[type]}
            </Text>
          </View>
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="gap-3 px-4">
          <Skeleton height={ITEM_HEIGHT} />
          <Skeleton height={ITEM_HEIGHT} />
          <Skeleton height={ITEM_HEIGHT} />
        </View>
      ) : (
        <FlatList
          data={opportunities ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-muted text-base">No opportunities found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
