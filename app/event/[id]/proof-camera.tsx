import { useCallback } from 'react'
import { View, Text } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ProofCamera } from '@/components/camera/ProofCamera'
import { usePhotoProof } from '@/hooks/useVerification'
import { COLORS } from '@/constants/theme'
import type { GpsCoords } from '@/services/verification.service'

export default function ProofCameraScreen() {
  const { id, registrationId } = useLocalSearchParams<{
    id: string
    registrationId?: string
  }>()

  const regId = registrationId ?? ''
  const photoProofMutation = usePhotoProof(regId)

  const handleCapture = useCallback(
    async (photoUri: string, location: GpsCoords | null) => {
      if (!regId) throw new Error('Registration ID is required')
      const result = await photoProofMutation.mutateAsync({ photoUri, location })
      if (result.error) throw new Error(result.error.message)
      // Navigate back after success
      router.back()
    },
    [regId, photoProofMutation]
  )

  const handleClose = useCallback(() => router.back(), [])

  if (!id || !regId) {
    return (
      <View
        style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}
      >
        <Text style={{ color: COLORS.muted }}>Missing event or registration ID.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ProofCamera onCapture={handleCapture} onClose={handleClose} />
    </View>
  )
}
