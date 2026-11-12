import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase/client'
import { getVolunteerById, upsertVolunteerFromAuth } from '@/services/volunteer.service'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { requestPushPermission, savePushToken } from '@/lib/notifications'
import type { Volunteer } from '@/types'

// ─── Session expiry ───────────────────────────────────────────────────────────

const LOGIN_AT_KEY = 'maatram:login_at'
const SESSION_MAX_MS = 6 * 60 * 60 * 1000 // 6 hours

async function stampLoginTime(): Promise<void> {
  await AsyncStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
}

async function clearLoginTime(): Promise<void> {
  await AsyncStorage.removeItem(LOGIN_AT_KEY)
}

/** Returns true if the stored login timestamp is older than SESSION_MAX_MS. */
async function isSessionExpired(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LOGIN_AT_KEY)
    if (!raw) {
      // No stamp yet (user logged in before this feature was deployed).
      // Treat as fresh — stamp now so the 6-hour clock starts from this refresh.
      await stampLoginTime()
      return false
    }
    return Date.now() - parseInt(raw, 10) > SESSION_MAX_MS
  } catch {
    return false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetches the volunteer row; if the row is missing (trigger not deployed),
 * auto-creates it from the auth user's metadata so the user isn't stuck.
 */
async function resolveVolunteer(userId: string, session: { user: { email?: string | null; user_metadata: Record<string, unknown> } }) {
  const result = await getVolunteerById(userId)
  if (result.data) return result

  // Row missing — upsert from auth metadata
  return upsertVolunteerFromAuth(
    userId,
    session.user.email ?? '',
    session.user.user_metadata
  )
}

async function registerPushTokenForVolunteer(volunteerId: string): Promise<void> {
  const result = await requestPushPermission()
  if (result.error || !result.data) return
  await savePushToken(volunteerId, result.data)
}

function checkNeedsOnboarding(volunteer: Volunteer | null): boolean {
  if (!volunteer) return false
  return volunteer.preferences.length === 0 && volunteer.skills.length === 0
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthListener() {
  const { setVolunteer, setLoading, setSession } = useAuthStore()
  const { setNeedsOnboarding } = useUIStore()
  const router = useRouter()

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      // Set session immediately — before any async volunteer fetch — so the
      // redirect gate in _layout.tsx sees the real session state right away.
      // Even if the volunteer DB fetch later fails, the user won't be kicked out.
      setSession(data.session)

      if (data.session?.user) {
        // Enforce 6-hour session limit on every restore
        const expired = await isSessionExpired()
        if (expired) {
          await clearLoginTime()
          await supabase.auth.signOut()
          // signOut fires SIGNED_OUT which calls setSession(null); setLoading here
          // ensures isLoading doesn't stay true forever if the event is delayed.
          setLoading(false)
          return
        }

        const result = await resolveVolunteer(data.session.user.id, data.session)
        setVolunteer(result.data)
        setNeedsOnboarding(checkNeedsOnboarding(result.data))

        if (result.data?.consent_push) {
          void registerPushTokenForVolunteer(result.data.id)
        }
      }
      setLoading(false)
    }).catch(() => {
      // If getSession() itself throws (e.g. network error at the storage level),
      // session stays null and isLoading is cleared — login redirect is correct.
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await clearLoginTime()
        setSession(null)
        setVolunteer(null)
        setNeedsOnboarding(false)
        router.replace('/(auth)/login')
        return
      }

      // Keep the stored session in sync for TOKEN_REFRESHED and other events.
      setSession(session)

      // SIGNED_IN fires only on explicit logins, not on session restores.
      // Record the timestamp here so the 6-hour clock starts at the actual login.
      if (event === 'SIGNED_IN') {
        await stampLoginTime()
      }

      if (session?.user) {
        const result = await resolveVolunteer(session.user.id, session)
        setVolunteer(result.data)
        setNeedsOnboarding(checkNeedsOnboarding(result.data))

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
