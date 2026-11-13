import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useAuthStore, selectIsAdmin } from '@/stores/auth.store'
import { COLORS } from '@/constants/theme'
import { MaatramLoader } from '@/components/ui/MaatramLoader'

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
    return <MaatramLoader />
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
