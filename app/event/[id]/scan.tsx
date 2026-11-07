import { useCallback } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import * as Location from 'expo-location'
import { QRScanner } from '@/components/qr/QRScanner'
import { useOpportunityById } from '@/hooks/useOpportunities'
import { useVerificationStatus, useCheckIn, useCheckOut } from '@/hooks/useVerification'
import { verifyQRPayload } from '@/lib/qr'
import { COLORS } from '@/constants/theme'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getLocationOrNull() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch {
    return null
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const { id, registrationId } = useLocalSearchParams<{
    id: string
    registrationId?: string
  }>()

  const regId = registrationId ?? ''
  const { data: opp, isLoading } = useOpportunityById(id ?? '')
  const { data: verification } = useVerificationStatus(regId)

  const checkInMutation  = useCheckIn(regId)
  const checkOutMutation = useCheckOut(regId)

  const isCheckedIn  = !!verification?.checkin_time
  const isCheckedOut = !!verification?.checkout_time

  const handleScan = useCallback(
    async (payload: string) => {
      if (!opp || !regId) throw new Error('Event or registration not found')
      if (!opp.qr_secret) throw new Error('This event has no QR secret configured')

      const { valid } = await verifyQRPayload(payload, opp.id, opp.qr_secret)
      if (!valid) throw new Error('Invalid or expired QR code')

      const location = await getLocationOrNull()

      if (!isCheckedIn) {
        // Check in
        const result = await checkInMutation.mutateAsync({ location, qrPayload: payload })
        if (result.error) throw new Error(result.error.message)
      } else if (!isCheckedOut) {
        // Check out
        if (!verification?.id) throw new Error('Verification record not found')
        const result = await checkOutMutation.mutateAsync({
          verificationId: verification.id,
          location,
        })
        if (result.error) throw new Error(result.error.message)
      } else {
        throw new Error('You have already checked in and out for this event')
      }

      // Navigate back after a brief success display
      setTimeout(() => router.back(), 1500)
    },
    [
      opp,
      regId,
      isCheckedIn,
      isCheckedOut,
      verification?.id,
      checkInMutation,
      checkOutMutation,
    ]
  )

  const handleClose = useCallback(() => router.back(), [])

  if (!id || !regId) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}
      >
        <Text style={{ color: COLORS.muted }}>Missing event or registration ID.</Text>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={COLORS.gold} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <QRScanner onScan={handleScan} onClose={handleClose} />
    </View>
  )
}
