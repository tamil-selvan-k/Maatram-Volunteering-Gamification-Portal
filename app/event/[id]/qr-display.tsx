import { useCallback, useRef, useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, Pressable, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { safeGoBack } from '@/utils/navigation'
import { ArrowLeft, RefreshCw, Download } from 'lucide-react-native'
import { MaatramLoader } from '@/components/ui/MaatramLoader'
import { QRDisplay, type QRDisplayHandle } from '@/components/qr/QRDisplay'
import { useOpportunityById } from '@/hooks/useOpportunities'
import { useAuthStore, selectIsAdmin } from '@/stores/auth.store'
import { supabase } from '@/lib/supabase/client'
import { COLORS } from '@/constants/theme'
import type { QRMode } from '@/lib/qr'

function generateNewSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export default function QRDisplayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isAdmin = useAuthStore(selectIsAdmin)
  const { data: opp, isLoading, refetch } = useOpportunityById(id ?? '')
  const [updating, setUpdating] = useState(false)
  const [localMode, setLocalMode] = useState<QRMode | null>(null)
  const qrRef = useRef<QRDisplayHandle>(null)

  const dbMode: QRMode = (opp as any)?.qr_mode === 'static' ? 'static' : 'rotating'
  const qrMode: QRMode = localMode ?? dbMode

  const toggleMode = useCallback(async (newMode: QRMode) => {
    if (!opp || updating) return
    setLocalMode(newMode)
    setUpdating(true)
    await supabase
      .from('opportunities')
      .update({ qr_mode: newMode })
      .eq('id', opp.id)
    await refetch()
    setUpdating(false)
  }, [opp, updating, refetch])

  const regenerateSecret = useCallback(async () => {
    if (!opp || updating) return
    const doRegenerate = async () => {
      setUpdating(true)
      await supabase
        .from('opportunities')
        .update({ qr_secret: generateNewSecret() })
        .eq('id', opp.id)
      await refetch()
      setUpdating(false)
    }
    if (Platform.OS === 'web') {
      if (window.confirm('Regenerate QR? This invalidates all previous QR codes (including printed ones). Volunteers who already scanned are unaffected.')) {
        await doRegenerate()
      }
    } else {
      Alert.alert(
        'Regenerate QR?',
        'This invalidates all previous QR codes (including printed ones). Volunteers who already scanned are unaffected.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', style: 'destructive', onPress: doRegenerate },
        ]
      )
    }
  }, [opp, updating, refetch])

  const downloadQR = useCallback(async () => {
    if (!qrRef.current || !opp) return
    try {
      const base64 = await qrRef.current.toDataURL()
      if (!base64) return

      const link = document.createElement('a')
      link.href = `data:image/png;base64,${base64}`
      link.download = `qr-${opp.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      Alert.alert('Error', 'Could not download QR code.')
    }
  }, [opp])

  const handleBack = useCallback(() => safeGoBack(), [])

  if (!isAdmin) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}
      >
        <Text style={{ color: COLORS.error, fontSize: 15, textAlign: 'center' }}>
          This screen is restricted to admins only.
        </Text>
        <TouchableOpacity onPress={handleBack} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.gold, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16, flex: 1 }} numberOfLines={1}>
          Venue QR Code
        </Text>
      </View>

      {/* Scrollable body */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <MaatramLoader />
        ) : !opp ? (
          <Text style={{ color: COLORS.muted }}>Event not found.</Text>
        ) : !opp.qr_secret ? (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Text style={{ color: COLORS.error, fontSize: 15, textAlign: 'center' }}>
              No QR secret configured for this event.
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center' }}>
              Set a qr_secret in the Supabase dashboard for event &quot;{opp.title}&quot;.
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 20, width: '100%', maxWidth: 400 }}>
            <Text
              style={{ color: COLORS.white, fontWeight: '700', fontSize: 18, textAlign: 'center' }}
              numberOfLines={2}
            >
              {opp.title}
            </Text>

            {/* Mode toggle */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: 'hidden',
                alignSelf: 'stretch',
              }}
            >
              <Pressable
                onPress={() => toggleMode('rotating')}
                disabled={updating}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  backgroundColor: qrMode === 'rotating' ? `${COLORS.gold}20` : 'transparent',
                  borderRightWidth: 1,
                  borderRightColor: COLORS.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: qrMode === 'rotating' ? COLORS.gold : COLORS.muted,
                  }}
                >
                  Rotating
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: qrMode === 'rotating' ? COLORS.gold : COLORS.muted,
                    marginTop: 2,
                    opacity: 0.8,
                  }}
                >
                  High security
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggleMode('static')}
                disabled={updating}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  backgroundColor: qrMode === 'static' ? `${COLORS.gold}20` : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: qrMode === 'static' ? COLORS.gold : COLORS.muted,
                  }}
                >
                  Static
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: qrMode === 'static' ? COLORS.gold : COLORS.muted,
                    marginTop: 2,
                    opacity: 0.8,
                  }}
                >
                  Printable
                </Text>
              </Pressable>
            </View>

            <QRDisplay ref={qrRef} eventId={opp.id} secret={opp.qr_secret} mode={qrMode} size={260} />

            {/* Action buttons row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Download button */}
              <Pressable
                onPress={downloadQR}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: `${COLORS.gold}15`,
                  borderWidth: 1,
                  borderColor: `${COLORS.gold}40`,
                }}
              >
                <Download size={14} color={COLORS.gold} />
                <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '600' }}>
                  Download
                </Text>
              </Pressable>

              {/* Regenerate button */}
              <Pressable
                onPress={regenerateSecret}
                disabled={updating}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.surface,
                  opacity: updating ? 0.5 : 1,
                }}
              >
                <RefreshCw size={14} color={COLORS.muted} />
                <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '600' }}>
                  Regenerate
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
