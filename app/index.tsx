import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { MaatramLoader } from '@/components/ui/MaatramLoader'

export default function IndexRedirect() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const volunteer = useAuthStore((s) => s.volunteer)
  const needsOnboarding = useUIStore((s) => s.needsOnboarding)

  if (isLoading) {
    return <MaatramLoader />
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
