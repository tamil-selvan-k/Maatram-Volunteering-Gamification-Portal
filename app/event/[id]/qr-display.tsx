import { useCallback } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { MaatramLoader } from '@/components/ui/MaatramLoader'
import { QRDisplay } from '@/components/qr/QRDisplay'
import { useOpportunityById } from '@/hooks/useOpportunities'
import { useAuthStore, selectIsAdmin } from '@/stores/auth.store'
import { COLORS } from '@/constants/theme'

// Admin-only screen — displays the rotating QR code for venue check-in.
// The QR secret is read from the opportunity's qr_secret field.

export default function QRDisplayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isAdmin = useAuthStore(selectIsAdmin)
  const { data: opp, isLoading } = useOpportunityById(id ?? '')

  const handleBack = useCallback(() => router.back(), [])

  if (!isAdmin) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}
      >
        <Text style={{ color: COLORS.error, fontSize: 15, textAlign: 'center' }}>
          This screen is restricted to admins only.
        </Text>
        <TouchableOpacity onPress={handleBack} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.gold, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

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
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16, flex: 1 }} numberOfLines={1}>
          Venue QR Code
        </Text>
      </View>

      {/* Body */}
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        {isLoading ? (
          <MaatramLoader />
        ) : !opp ? (
          <Text style={{ color: COLORS.muted }}>Event not found.</Text>
        ) : !opp.qr_secret ? (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Text style={{ color: COLORS.error, fontSize: 15, textAlign: 'center' }}>
              No QR secret configured for this event.
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center' }}>
              Set a qr_secret in the Supabase dashboard for event "{opp.title}".
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 20, width: '100%' }}>
            <Text
              style={{ color: COLORS.white, fontWeight: '700', fontSize: 18, textAlign: 'center' }}
              numberOfLines={2}
            >
              {opp.title}
            </Text>

            <QRDisplay eventId={opp.id} secret={opp.qr_secret} size={260} />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
