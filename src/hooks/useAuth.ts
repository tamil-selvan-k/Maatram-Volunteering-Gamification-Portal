import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { getVolunteerById } from '@/services/volunteer.service'
import { useAuthStore } from '@/stores/auth.store'

export function useAuthListener() {
  const { setVolunteer, setLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const result = await getVolunteerById(data.session.user.id)
        setVolunteer(result.data)
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
      }
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
