import React, { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Clock, Users, Wifi, WifiOff, MapPin } from 'lucide-react-native'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { Button } from '@/components/ui/Button'
import { formatTimeLeft, formatEventDate, formatEventTime } from '@/utils'
import { COLORS } from '@/constants/theme'
import type { Opportunity } from '@/types'

interface OpportunityCardProps {
  opportunity: Opportunity
  onRegister: (id: string) => void
  isRegistering?: boolean
}

function slotColor(slots: number): string {
  if (slots > 6) return COLORS.success
  if (slots > 3) return COLORS.warning
  return COLORS.error
}

export const OpportunityCard = memo(function OpportunityCard({
  opportunity: opp,
  onRegister,
  isRegistering = false,
}: OpportunityCardProps) {
  const handleRegister = useCallback(() => {
    onRegister(opp.id)
  }, [opp.id, onRegister])

  const handleCardPress = useCallback(() => {
    router.push(`/event/${opp.id}`)
  }, [opp.id])

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={0.85}
      className="bg-surface border border-border rounded-2xl p-4 mb-3"
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-3">
        <ActivityBadge type={opp.activity_type} />
        <View className="bg-surface-elevated px-2.5 py-1 rounded-lg">
          <Text className="text-yellow-400 text-xs font-semibold">
            {formatTimeLeft(opp.registration_deadline)}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text className="text-white font-bold text-[15px] leading-5 mb-1">{opp.title}</Text>

      {/* Description */}
      {opp.description && (
        <Text className="text-muted text-sm leading-5 mb-3" numberOfLines={2}>
          {opp.description}
        </Text>
      )}

      {/* Meta chips */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mb-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-muted text-xs">
            {formatEventDate(opp.event_date)} · {formatEventTime(opp.event_date)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color={COLORS.muted} />
          <Text className="text-muted text-xs">{opp.duration_hours}h</Text>
        </View>
        <View className="flex-row items-center gap-1">
          {opp.mode === 'online' ? (
            <Wifi size={12} color={COLORS.muted} />
          ) : (
            <WifiOff size={12} color={COLORS.muted} />
          )}
          <Text className="text-muted text-xs capitalize">{opp.mode}</Text>
        </View>
        {opp.location && (
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color={COLORS.muted} />
            <Text className="text-muted text-xs" numberOfLines={1}>
              {opp.location}
            </Text>
          </View>
        )}
      </View>

      {/* Footer row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Users size={14} color={slotColor(opp.total_slots)} />
          <Text className="text-xs font-semibold" style={{ color: slotColor(opp.total_slots) }}>
            {opp.total_slots} slots open
          </Text>
        </View>
        <Button title="I'm In" size="sm" loading={isRegistering} onPress={handleRegister} />
      </View>
    </TouchableOpacity>
  )
})
