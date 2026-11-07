import { useCallback } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { PeerConfirmList } from '@/components/verification/PeerConfirmList'
import { usePeerConfirmation } from '@/hooks/useVerification'
import { COLORS } from '@/constants/theme'

// Post-event peer confirmation screen.
// Triggered by a push notification deep-link or manually after checking out.

export default function PeerConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { peersQuery, confirmMutation } = usePeerConfirmation(id ?? '')

  const handleBack = useCallback(() => router.back(), [])

  const handleSubmit = useCallback(
    async (selectedIds: string[]) => {
      for (const confirmedId of selectedIds) {
        await confirmMutation.mutateAsync({ confirmedId })
      }
      router.back()
    },
    [confirmMutation]
  )

  if (!id) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>
            Peer Confirmation
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 1 }}>
            Confirm who attended this event with you
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View
        style={{
          margin: 16,
          padding: 12,
          backgroundColor: COLORS.gold + '15',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.gold + '40',
        }}
      >
        <Text style={{ color: COLORS.gold, fontSize: 13, lineHeight: 19 }}>
          Confirming a fellow volunteer increases their verification multiplier to{' '}
          <Text style={{ fontWeight: '700' }}>1.1x–1.25x</Text>. Only confirm people
          you genuinely saw at the venue.
        </Text>
      </View>

      {/* List */}
      {peersQuery.isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      ) : peersQuery.isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: COLORS.error, textAlign: 'center' }}>
            Failed to load attendees. Please try again.
          </Text>
        </View>
      ) : (
        <PeerConfirmList
          peers={peersQuery.data ?? []}
          isSubmitting={confirmMutation.isPending}
          onSubmit={handleSubmit}
        />
      )}
    </SafeAreaView>
  )
}
