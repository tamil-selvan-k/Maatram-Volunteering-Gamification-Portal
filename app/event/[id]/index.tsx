import { useCallback, useMemo } from 'react'
import { ScrollView, View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft,
  QrCode,
  Camera,
  Users,
  MapPin,
  Clock,
  Calendar,
  LogIn,
  LogOut,
} from 'lucide-react-native'
import { MaatramLoader } from '@/components/ui/MaatramLoader'
import { useOpportunityById, useSelectedCounts } from '@/hooks/useOpportunities'
import { useVerificationStatus } from '@/hooks/useVerification'
import { useAuthStore, selectVolunteer, selectIsAdmin } from '@/stores/auth.store'
import { VerificationBadge } from '@/components/verification/VerificationBadge'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { Button } from '@/components/ui/Button'
import { COLORS } from '@/constants/theme'
import { formatEventDate, formatEventTime } from '@/utils'
import { computeVerificationLevel } from '@/utils/verification'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the event starts within ±30 minutes of now. */
function isCheckinWindow(eventDate: string): boolean {
  const eventMs = new Date(eventDate).getTime()
  const now = Date.now()
  const diffMin = (eventMs - now) / 60_000
  return diffMin >= -30 && diffMin <= 30
}

/** Format elapsed time since check-in. */
function elapsedSince(isoTime: string): string {
  const ms = Date.now() - new Date(isoTime).getTime()
  const totalMins = Math.floor(ms / 60_000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventDetailScreen() {
  const { id, registrationId } = useLocalSearchParams<{
    id: string
    registrationId?: string
  }>()

  const volunteer  = useAuthStore(selectVolunteer)
  const isAdmin    = useAuthStore(selectIsAdmin)

  const { data: opp, isLoading: oppLoading } = useOpportunityById(id ?? '')
  const { data: selectedCounts } = useSelectedCounts(id ? [id] : [])

  // registrationId may be passed as a query param or be absent
  const regId = registrationId ?? ''
  const { data: verification } = useVerificationStatus(regId)

  const verLevel = useMemo(() => {
    if (!verification) return null
    return computeVerificationLevel({
      checkin_time:  verification.checkin_time,
      checkout_time: verification.checkout_time,
      photo_url:     verification.photo_url,
      peer_confirms: verification.peer_confirms,
      admin_approved: verification.admin_approved,
    })
  }, [verification])

  const hasCheckedIn  = !!verification?.checkin_time
  const hasCheckedOut = !!verification?.checkout_time

  const canCheckin = useMemo(
    () => opp && isCheckinWindow(opp.event_date),
    [opp]
  )

  const handleBack = useCallback(() => router.back(), [])

  const goToScan = useCallback(() => {
    router.push(`/event/${id}/scan?registrationId=${regId}`)
  }, [id, regId])

  const goToProofCamera = useCallback(() => {
    router.push(`/event/${id}/proof-camera?registrationId=${regId}`)
  }, [id, regId])

  const goToPeerConfirm = useCallback(() => {
    router.push(`/event/${id}/peer-confirm?registrationId=${regId}`)
  }, [id, regId])

  const goToAdminQR = useCallback(() => {
    router.push(`/event/${id}/qr-display`)
  }, [id])

  if (!id) return null

  if (oppLoading) {
    return <MaatramLoader />
  }

  if (!opp) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: COLORS.muted, fontSize: 15 }}>Event not found.</Text>
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
        <Text style={{ flex: 1, color: COLORS.white, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
          {opp.title}
        </Text>
        {isAdmin && (
          <TouchableOpacity onPress={goToAdminQR} activeOpacity={0.7}>
            <QrCode size={22} color={COLORS.gold} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Activity badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ActivityBadge type={opp.activity_type} />
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor:
                opp.status === 'open'
                  ? COLORS.success + '20'
                  : COLORS.surfaceElevated,
              borderWidth: 1,
              borderColor: opp.status === 'open' ? COLORS.success + '50' : COLORS.border,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: opp.status === 'open' ? COLORS.success : COLORS.muted,
                textTransform: 'capitalize',
              }}
            >
              {opp.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
          {opp.title}
        </Text>

        {/* Description */}
        {opp.description && (
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 16 }}>
            {opp.description}
          </Text>
        )}

        {/* Meta */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 16,
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { Icon: Calendar, label: `${formatEventDate(opp.event_date)} at ${formatEventTime(opp.event_date)}` },
            { Icon: Clock, label: `${opp.duration_hours} hours` },
            { Icon: MapPin, label: opp.location ?? (opp.mode === 'online' ? 'Online event' : 'Location TBD') },
            { Icon: Users, label: `${Math.max(0, opp.total_slots - (selectedCounts?.[opp.id] ?? 0))} of ${opp.total_slots} slots left` },
          ].map(({ Icon, label }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon size={16} color={COLORS.muted} />
              <Text style={{ color: COLORS.white, fontSize: 14 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Verification status */}
        {verLevel && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>
              YOUR VERIFICATION STATUS
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <VerificationBadge level={verLevel} />
              {verification?.checkin_time && !hasCheckedOut && (
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                  Checked in {elapsedSince(verification.checkin_time)} ago
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action hub — only shown for registered volunteers */}
        {volunteer && regId ? (
          <View style={{ gap: 12 }}>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
              CHECK-IN ACTIONS
            </Text>

            {/* Check-in via QR */}
            {!hasCheckedIn && (
              <Button
                title="Scan QR to Check In"
                onPress={goToScan}
                disabled={!canCheckin}
                icon={<LogIn size={16} color={canCheckin ? COLORS.bg : COLORS.muted} />}
              />
            )}

            {/* Check-out via QR */}
            {hasCheckedIn && !hasCheckedOut && (
              <Button
                title="Scan QR to Check Out"
                onPress={goToScan}
                variant="secondary"
                icon={<LogOut size={16} color={COLORS.gold} />}
              />
            )}

            {/* Upload photo proof */}
            {hasCheckedIn && (
              <Button
                title="Upload Photo Proof"
                onPress={goToProofCamera}
                variant="secondary"
                icon={<Camera size={16} color={COLORS.gold} />}
              />
            )}

            {/* Peer confirmation (post-event) */}
            {hasCheckedOut && (
              <Button
                title="Confirm Fellow Volunteers"
                onPress={goToPeerConfirm}
                variant="secondary"
                icon={<Users size={16} color={COLORS.gold} />}
              />
            )}

            {/* No actions available */}
            {!hasCheckedIn && !canCheckin && (
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center' }}>
                  Check-in opens 30 minutes before the event starts
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
