import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useAuthStore, selectIsAdmin } from '@/stores/auth.store'
import { COLORS } from '@/constants/theme'

export default function AdminLayout() {
  const isAdmin  = useAuthStore(selectIsAdmin)
  const isLoading = useAuthStore((s) => s.isLoading)
  const router   = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/(tabs)/')
    }
  }, [isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    )
  }

  if (!isAdmin) {
    // Will redirect via the effect; render nothing while navigating
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
