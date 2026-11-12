import { useCallback, useState } from 'react'
import { View, Text, FlatList, ScrollView, TouchableOpacity, type ListRenderItem } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search, SlidersHorizontal } from 'lucide-react-native'
import { useOpportunities, useRegisterInterest } from '@/hooks/useOpportunities'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { ACTIVITY_LABELS } from '@/constants/activities'
import { COLORS } from '@/constants/theme'
import type { ActivityType, Opportunity, OpportunityFilters } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = [
  'physical_event',
  'physical_verification',
  'school_visit',
  'office_bg_work',
  'telephone_verification',
  'other_small_work',
]

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

  const count = opportunities?.length ?? 0
  const hasFilters = !!search || activeFilter !== null

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white font-bold text-xl mb-1">Browse Opportunities</Text>
        <Text className="text-muted text-sm mb-3">Find and register for volunteering events</Text>
        <Input
          placeholder="Search opportunities..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={16} color={COLORS.muted} />}
          className="mb-3"
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8, alignItems: 'center' }}
      >
        <TouchableOpacity
          onPress={() => setActiveFilter(null)}
          className={`px-3 py-1.5 rounded-full border ${
            activeFilter === null ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
          }`}
        >
          <Text className={`text-xs font-semibold ${activeFilter === null ? 'text-gold' : 'text-muted'}`}>
            All
          </Text>
        </TouchableOpacity>
        {ACTIVITY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setActiveFilter(activeFilter === type ? null : type)}
            className={`px-3 py-1.5 rounded-full border ${
              activeFilter === type ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${activeFilter === type ? 'text-gold' : 'text-muted'}`}>
              {ACTIVITY_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count row — shown only when there are results or active filters */}
      {!isLoading && (count > 0 || hasFilters) && (
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-muted text-xs">
            {count === 0
              ? 'No results'
              : `${count} ${count === 1 ? 'opportunity' : 'opportunities'}`}
          </Text>
          {hasFilters && (
            <TouchableOpacity
              onPress={() => { setSearch(''); setActiveFilter(null) }}
              className="flex-row items-center gap-1"
            >
              <SlidersHorizontal size={12} color={COLORS.gold} />
              <Text className="text-gold text-xs font-semibold">Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading ? (
        <View className="gap-3 px-4 pt-1">
          <Skeleton height={160} />
          <Skeleton height={180} />
          <Skeleton height={160} />
        </View>
      ) : (
        <FlatList
          data={opportunities ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16 gap-3">
              <View className="w-14 h-14 rounded-full bg-surface items-center justify-center">
                <Search size={24} color={COLORS.muted} />
              </View>
              <Text className="text-white font-semibold text-base">No opportunities found</Text>
              <Text className="text-muted text-sm text-center px-8">
                {hasFilters
                  ? 'Try clearing your filters or searching with different keywords.'
                  : 'Check back soon — new volunteering events are added regularly.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
