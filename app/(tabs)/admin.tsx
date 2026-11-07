import { useEffect } from 'react'
import { useRouter } from 'expo-router'

/**
 * This file exists only to satisfy Expo Router's file-based routing for the
 * "Admin" tab. The tab's `href` option in _layout.tsx redirects to `/admin`
 * (the dedicated admin stack), so this screen is never actually rendered.
 */
export default function AdminTabRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin')
  }, [router])

  return null
}
