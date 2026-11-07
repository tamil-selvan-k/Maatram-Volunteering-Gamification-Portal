import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { getVolunteerById } from '@/services/volunteer.service'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { requestPushPermission, savePushToken } from '@/lib/notifications'
import type { Volunteer } from '@/types'

async function registerPushTokenForVolunteer(volunteerId: string): Promise<void> {
  const result = await requestPushPermission()
  if (result.error || !result.data) return
  await savePushToken(volunteerId, result.data)
}

function checkNeedsOnboarding(volunteer: Volunteer | null): boolean {
  if (!volunteer) return false
  return volunteer.preferences.length === 0 && volunteer.skills.length === 0
}

export function useAuthListener() {
  const { setVolunteer, setLoading } = useAuthStore()
  const { setNeedsOnboarding } = useUIStore()
  const router = useRouter()

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const result = await getVolunteerById(data.session.user.id)
        setVolunteer(result.data)
        setNeedsOnboarding(checkNeedsOnboarding(result.data))

        // Register push token if consent given
        if (result.data?.consent_push) {
          void registerPushTokenForVolunteer(result.data.id)
        }
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setVolunteer(null)
        setNeedsOnboarding(false)
        router.replace('/(auth)/login')
        return
      }
      if (session?.user) {
        const result = await getVolunteerById(session.user.id)
        setVolunteer(result.data)
        setNeedsOnboarding(checkNeedsOnboarding(result.data))

        // Register push token if consent given
        if (result.data?.consent_push) {
          void registerPushTokenForVolunteer(result.data.id)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
