import React, { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Calendar, Clock, Users, Globe, Building2, MapPin, CheckCircle } from 'lucide-react-native'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { Button } from '@/components/ui/Button'
import { ACTIVITY_STYLES } from '@/constants/activities'
import { formatTimeLeft, formatEventDate, formatEventTime } from '@/utils'
import { COLORS } from '@/constants/theme'
import type { Opportunity, RegistrationStatus } from '@/types'

interface OpportunityCardProps {
  opportunity: Opportunity
  onRegister: (id: string) => void
  isRegistering?: boolean
  registrationStatus?: RegistrationStatus | null
  filledSlots?: number
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

const STATUS_LABELS: Partial<Record<RegistrationStatus, { label: string; color: string }>> = {
  registered: { label: 'Registered', color: COLORS.success },
  selected:   { label: 'Selected',   color: COLORS.success },
  waitlisted: { label: 'Waitlisted', color: COLORS.warning },
  declined:   { label: 'Declined',   color: COLORS.error },
  no_show:    { label: 'No Show',    color: COLORS.error },
}

export const OpportunityCard = memo(function OpportunityCard({
  opportunity: opp,
  onRegister,
  isRegistering = false,
  registrationStatus,
  filledSlots = 0,
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
  const remaining = Math.max(0, opp.total_slots - filledSlots)

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
            <Users size={14} color={slotColor(remaining)} />
            <Text className="text-xs font-semibold" style={{ color: slotColor(remaining) }}>
              {remaining} of {opp.total_slots} slots left
            </Text>
          </View>
          {registrationStatus ? (
            <View
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: (STATUS_LABELS[registrationStatus]?.color ?? COLORS.muted) + '20',
                borderWidth: 1,
                borderColor: (STATUS_LABELS[registrationStatus]?.color ?? COLORS.muted) + '50',
              }}
            >
              <CheckCircle size={12} color={STATUS_LABELS[registrationStatus]?.color ?? COLORS.muted} />
              <Text
                className="text-xs font-semibold"
                style={{ color: STATUS_LABELS[registrationStatus]?.color ?? COLORS.muted }}
              >
                {STATUS_LABELS[registrationStatus]?.label ?? registrationStatus}
              </Text>
            </View>
          ) : (
            <Button title="Register" size="sm" loading={isRegistering} onPress={handleRegister} />
          )}
        </View>
      </View>
    </View>
  )
})
