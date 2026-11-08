import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'

export default function IndexRedirect() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const volunteer = useAuthStore((s) => s.volunteer)
  const needsOnboarding = useUIStore((s) => s.needsOnboarding)

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    )
  }

  if (!volunteer) {
    return <Redirect href="/(auth)/login" />
  }

  if (needsOnboarding) {
    return <Redirect href="/(auth)/onboarding" />
  }

  if (volunteer.is_admin) {
    return <Redirect href="/admin" />
  }

  return <Redirect href="/(tabs)" />
}
