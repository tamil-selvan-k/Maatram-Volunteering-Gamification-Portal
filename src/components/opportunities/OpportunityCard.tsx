import React, { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Calendar, Clock, Users, Globe, Building2, MapPin } from 'lucide-react-native'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { Button } from '@/components/ui/Button'
import { ACTIVITY_STYLES } from '@/constants/activities'
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

function deadlineBadgeColors(timeLeft: string): { bg: string; text: string } {
  if (timeLeft === 'Closed') return { bg: COLORS.error + '22', text: COLORS.error }
  if (timeLeft.endsWith('h left')) return { bg: '#F9731622', text: COLORS.warning }
  return { bg: COLORS.surfaceElevated, text: '#FACC15' }
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

  const timeLeft = formatTimeLeft(opp.registration_deadline)
  const deadlineColors = deadlineBadgeColors(timeLeft)
  const accentColor = ACTIVITY_STYLES[opp.activity_type].accent

  return (
    <View className="bg-surface border border-border rounded-2xl mb-3 overflow-hidden flex-row">
      {/* Activity-type accent strip */}
      <View style={{ width: 3, backgroundColor: accentColor }} />

      <View className="flex-1">
        {/* Tappable card body — navigates to detail */}
        <TouchableOpacity onPress={handleCardPress} activeOpacity={0.85} className="p-4 pb-2">
          {/* Header row */}
          <View className="flex-row items-center justify-between mb-3">
            <ActivityBadge type={opp.activity_type} />
            <View
              className="px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: deadlineColors.bg }}
            >
              <Text className="text-xs font-semibold" style={{ color: deadlineColors.text }}>
                {timeLeft}
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
          <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color={COLORS.muted} />
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
                <Globe size={12} color={COLORS.muted} />
              ) : (
                <Building2 size={12} color={COLORS.muted} />
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
        </TouchableOpacity>

        {/* Footer row — outside the card TouchableOpacity so Register doesn't navigate */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-1.5">
            <Users size={14} color={slotColor(opp.total_slots)} />
            <Text className="text-xs font-semibold" style={{ color: slotColor(opp.total_slots) }}>
              {opp.total_slots} slots
            </Text>
          </View>
          <Button title="Register" size="sm" loading={isRegistering} onPress={handleRegister} />
        </View>
      </View>
    </View>
  )
})
