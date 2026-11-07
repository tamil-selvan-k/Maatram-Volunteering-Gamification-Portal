import React, { memo } from 'react'
import { View, Text, FlatList } from 'react-native'
import { BADGE_DEFINITIONS } from '@/constants/levels'

interface BadgeGridProps {
  earnedBadgeTypes: string[]
}

interface BadgeItemProps {
  badge: (typeof BADGE_DEFINITIONS)[number]
  earned: boolean
}

const BadgeItem = memo(function BadgeItem({ badge, earned }: BadgeItemProps) {
  return (
    <View
      className={`items-center gap-1 p-3 rounded-2xl border ${earned ? 'bg-surface border-border' : 'bg-surface/30 border-border/30'}`}
      style={{ flex: 1, margin: 4 }}
    >
      <Text style={{ fontSize: 24, opacity: earned ? 1 : 0.3 }}>{badge.icon}</Text>
      <Text
        className={`text-xs font-semibold text-center ${earned ? 'text-white' : 'text-muted/40'}`}
        numberOfLines={1}
      >
        {badge.name}
      </Text>
      {!earned && <Text className="text-xs text-muted/30">🔒</Text>}
    </View>
  )
})

export function BadgeGrid({ earnedBadgeTypes }: BadgeGridProps) {
  return (
    <FlatList
      data={BADGE_DEFINITIONS}
      keyExtractor={(item) => item.type}
      numColumns={3}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <BadgeItem badge={item} earned={earnedBadgeTypes.includes(item.type)} />
      )}
      columnWrapperStyle={{ gap: 4 }}
    />
  )
}
