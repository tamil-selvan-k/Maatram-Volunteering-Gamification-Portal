import { router } from 'expo-router'

export function safeGoBack(r?: { canGoBack: () => boolean; back: () => void; replace: (href: any) => void }) {
  const nav = r ?? router
  if (nav.canGoBack()) {
    nav.back()
  } else {
    nav.replace('/(tabs)' as never)
  }
}
