import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { getVolunteerById } from '@/services/volunteer.service'
import { useAuthStore } from '@/stores/auth.store'
import { requestPushPermission, savePushToken } from '@/lib/notifications'

async function registerPushTokenForVolunteer(volunteerId: string): Promise<void> {
  const result = await requestPushPermission()
  if (result.error || !result.data) return
  await savePushToken(volunteerId, result.data)
}

export function useAuthListener() {
  const { setVolunteer, setLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const result = await getVolunteerById(data.session.user.id)
        setVolunteer(result.data)

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
        router.replace('/(auth)/login')
        return
      }
      if (session?.user) {
        const result = await getVolunteerById(session.user.id)
        setVolunteer(result.data)

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
