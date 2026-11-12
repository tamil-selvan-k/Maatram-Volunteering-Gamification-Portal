import React, { memo, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Check, X } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import {
  usePendingVerifications,
  useApproveVerification,
  useRejectVerification,
} from '@/hooks/useAdmin'
import type { PendingVerificationRow } from '@/services/admin.service'

// ─── Verification card ────────────────────────────────────────────────────────

const VerificationCard = memo(function VerificationCard({
  item,
}: {
  item: PendingVerificationRow
}) {
  const { mutate: approve, isPending: isApproving } = useApproveVerification()
  const { mutate: reject, isPending: isRejecting } = useRejectVerification()
  const isPending = isApproving || isRejecting

  const handleApprove = () => {
    Alert.alert(
      'Approve Verification',
      `Approve photo proof from ${item.volunteer_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () =>
            approve(item.id, {
              onError: () => Alert.alert('Error', 'Failed to approve verification.'),
            }),
        },
      ]
    )
  }

  const handleReject = () => {
    Alert.alert(
      'Reject Verification',
      `Reject and remove photo proof from ${item.volunteer_name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () =>
            reject(item.id, {
              onError: () => Alert.alert('Error', 'Failed to reject verification.'),
            }),
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
        marginBottom: 12,
      }}
    >
      {/* Volunteer + event info */}
      <Text
        style={{ color: COLORS.white, fontWeight: '700', fontSize: 15, marginBottom: 2 }}
        numberOfLines={1}
      >
        {item.volunteer_name}
      </Text>
      <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 2 }} numberOfLines={1}>
        {item.volunteer_email}
      </Text>
      <Text
        style={{
          color: COLORS.gold,
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 10,
        }}
        numberOfLines={1}
      >
        {item.opportunity_title}
      </Text>

      {/* Photo preview */}
      <Image
        source={{ uri: item.photo_url }}
        style={{
          width: '100%',
          height: 180,
          borderRadius: 10,
          backgroundColor: COLORS.bgSecondary,
          marginBottom: 12,
        }}
        resizeMode="cover"
      />

      {/* Submitted time */}
      <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 12 }}>
        Submitted {new Date(item.created_at).toLocaleString()}
      </Text>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={handleApprove}
          disabled={isPending}
          activeOpacity={0.7}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${COLORS.success}50`,
            backgroundColor: `${COLORS.success}18`,
            opacity: isPending ? 0.5 : 1,
          }}
        >
          <Check size={15} color={COLORS.success} />
          <Text style={{ color: COLORS.success, fontWeight: '600', fontSize: 13 }}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleReject}
          disabled={isPending}
          activeOpacity={0.7}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${COLORS.error}40`,
            backgroundColor: `${COLORS.error}12`,
            opacity: isPending ? 0.5 : 1,
          }}
        >
          <X size={15} color={COLORS.error} />
          <Text style={{ color: COLORS.error, fontWeight: '600', fontSize: 13 }}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VerificationsScreen() {
  const router = useRouter()
  const { data: verifications = [], isLoading } = usePendingVerifications()

  const renderItem = useCallback(
    ({ item }: { item: PendingVerificationRow }) => <VerificationCard item={item} />,
    []
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
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 17 }}>
          Photo Verifications
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.gold} />
          <Text style={{ color: COLORS.muted, marginTop: 10, fontSize: 13 }}>Loading…</Text>
        </View>
      ) : verifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center' }}>
            No pending photo verifications.
          </Text>
        </View>
      ) : (
        <FlatList
          data={verifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 12 }}>
              {verifications.length} pending review
            </Text>
          }
        />
      )}
    </SafeAreaView>
  )
}
