import React, { memo, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { COLORS } from '@/constants/theme'
import { useOpportunityRegistrations, useUpdateRegistrationStatus } from '@/hooks/useAdmin'
import type { AdminRegistrationRow } from '@/services/admin.service'
import type { RegistrationStatus } from '@/types'

// ─── Verification level badge ─────────────────────────────────────────────────

const VERIFICATION_COLORS: Record<string, string> = {
  gold_standard:  '#F5B800',
  qr_peer:        '#8B5CF6',
  qr_full:        '#22C55E',
  peer_partial:   '#3B82F6',
  qr_partial:     '#06B6D4',
  photo_pending:  '#F97316',
  self_report:    '#9CA3AF',
}

function VerificationBadge({ level }: { level: string | null }) {
  if (!level) return null
  const color = VERIFICATION_COLORS[level] ?? COLORS.muted
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: `${color}18`,
        borderWidth: 1,
        borderColor: `${color}40`,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '600' }}>
        {level.replace(/_/g, ' ')}
      </Text>
    </View>
  )
}

// ─── Registration status badge ────────────────────────────────────────────────

const STATUS_COLORS: Partial<Record<RegistrationStatus, string>> = {
  registered:  COLORS.muted,
  selected:    COLORS.success,
  waitlisted:  COLORS.warning,
  declined:    COLORS.error,
  no_show:     COLORS.error,
}

function RegStatusBadge({ status }: { status: RegistrationStatus }) {
  const color = STATUS_COLORS[status] ?? COLORS.muted
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: `${color}18`,
        borderWidth: 1,
        borderColor: `${color}40`,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  )
}

// ─── Registration row ─────────────────────────────────────────────────────────

const RegistrationRow = memo(function RegistrationRow({
  item,
  opportunityId,
}: {
  item: AdminRegistrationRow
  opportunityId: string
}) {
  const { mutate: updateStatus, isPending } = useUpdateRegistrationStatus()

  const handleAction = (status: 'selected' | 'rejected') => {
    Alert.alert(
      `Mark as ${status}?`,
      `Set ${item.volunteer_name}'s registration to "${status}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: () => {
            updateStatus(
              { registrationId: item.id, status, opportunityId },
              {
                onError: () => Alert.alert('Error', 'Failed to update status.'),
              }
            )
          },
        },
      ]
    )
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
            {item.volunteer_name}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12 }} numberOfLines={1}>
            {item.volunteer_email}
          </Text>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          <RegStatusBadge status={item.status} />
          <VerificationBadge level={item.verification_level} />
        </View>
      </View>

      {/* Action buttons */}
      {(item.status === 'registered' || item.status === 'waitlisted') && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => handleAction('selected')}
            disabled={isPending}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: `${COLORS.success}20`,
              borderWidth: 1,
              borderColor: `${COLORS.success}50`,
              opacity: isPending ? 0.5 : 1,
            }}
          >
            <Text style={{ color: COLORS.success, fontWeight: '600', fontSize: 13 }}>
              Select
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAction('rejected')}
            disabled={isPending}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: `${COLORS.error}15`,
              borderWidth: 1,
              borderColor: `${COLORS.error}40`,
              opacity: isPending ? 0.5 : 1,
            }}
          >
            <Text style={{ color: COLORS.error, fontWeight: '600', fontSize: 13 }}>
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
})

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: registrations = [], isLoading } = useOpportunityRegistrations(id ?? '')

  const totalApplicants = registrations.length
  const totalSelected = registrations.filter((r) => r.status === 'selected').length

  const renderItem = useCallback(
    ({ item }: { item: AdminRegistrationRow }) => (
      <RegistrationRow item={item} opportunityId={id ?? ''} />
    ),
    [id]
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ color: COLORS.gold, fontSize: 15, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>
          Registrations
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          padding: 16,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 22 }}>
            {totalApplicants}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>Applicants</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 22 }}>
            {totalSelected}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>Selected</Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.gold} />
        </View>
      ) : registrations.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center' }}>
            No registrations for this opportunity yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}
