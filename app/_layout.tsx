import '../global.css'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { useAuthListener } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { LevelUpModal } from '@/components/gamification/LevelUpModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function RootLayoutNav() {
  useAuthListener()
  const isLoading = useAuthStore((s) => s.isLoading)
  const volunteer = useAuthStore((s) => s.volunteer)
  const needsOnboarding = useUIStore((s) => s.needsOnboarding)
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoading && volunteer && needsOnboarding) {
      router.replace('/(auth)/onboarding')
    }
  }, [isLoading, volunteer, needsOnboarding, router])

  if (isLoading && !timedOut) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    )
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D0D0F' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="event" options={{ headerShown: false }} />
        <Stack.Screen name="demo" options={{ headerShown: false }} />
      </Stack>
      <LevelUpModal />
    </>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <ErrorBoundary>
        <RootLayoutNav />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
