import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Database } from './database.types'

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

// On web, Supabase resolves its initial session synchronously from storage.
// AsyncStorage is async-only on web (Promise-based localStorage wrapper), which
// causes a race: the session read hasn't resolved by the time the first render
// fires, so the app sees no session and redirects to login.
// Using localStorage directly on web avoids this race entirely.
const authStorage =
  Platform.OS === 'web'
    ? {
        getItem:    (key: string) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
        setItem:    (key: string, value: string) => { globalThis.localStorage?.setItem(key, value); return Promise.resolve() },
        removeItem: (key: string) => { globalThis.localStorage?.removeItem(key); return Promise.resolve() },
      }
    : AsyncStorage

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
