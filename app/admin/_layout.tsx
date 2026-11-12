import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useAuthStore, selectIsAdmin } from '@/stores/auth.store'
import { COLORS } from '@/constants/theme'

export default function AdminLayout() {
  const isAdmin   = useAuthStore(selectIsAdmin)
  const isLoading = useAuthStore((s) => s.isLoading)
  const volunteer = useAuthStore((s) => s.volunteer)
  const router    = useRouter()

  useEffect(() => {
    // Only redirect when the volunteer row has actually loaded (not null).
    // If volunteer is null the DB fetch may have failed — don't kick the user out.
    if (!isLoading && volunteer !== null && !isAdmin) {
      router.replace('/(tabs)')
    }
  }, [isLoading, volunteer, isAdmin, router])

  if (isLoading || volunteer === null) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: 'slide_from_right',
      }}
    />
  )
}
