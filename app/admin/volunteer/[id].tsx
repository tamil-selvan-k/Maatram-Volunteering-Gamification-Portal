import React, { memo, useCallback, useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { safeGoBack } from '@/utils/navigation'
import { ArrowLeft, Award, Clock, Star } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import { useVolunteerProfile } from '@/hooks/useAdmin'
import { MaatramLoader } from '@/components/ui/MaatramLoader'
import type { VolunteerRegistrationHistory } from '@/services/admin.service'
import type { RegistrationStatus } from '@/types'

// ─── Status colors ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  registered: COLORS.muted,
  selected:   COLORS.success,
  waitlisted: COLORS.warning,
  declined:   COLORS.error,
  no_show:    COLORS.error,
}

const VERIFICATION_COLORS: Record<string, string> = {
  gold_standard: '#F5B800',
  qr_peer:       '#8B5CF6',
  qr_full:       '#22C55E',
  peer_partial:  '#3B82F6',
  qr_partial:    '#06B6D4',
  photo_pending: '#F97316',
  self_report:   '#9CA3AF',
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color, fontWeight: '800', fontSize: 18 }}>{value}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

// ─── History row ─────────────────────────────────────────────────────────────

const HistoryRow = memo(function HistoryRow({ item }: { item: VolunteerRegistrationHistory }) {
  const statusColor = STATUS_COLORS[item.status] ?? COLORS.muted
  const verColor = item.verification_level
    ? VERIFICATION_COLORS[item.verification_level] ?? COLORS.muted
    : null

  const eventDate = item.event_date
    ? new Date(item.event_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Text
          style={{ color: COLORS.white, fontWeight: '600', fontSize: 14, flex: 1, marginRight: 8 }}
          numberOfLines={2}
        >
          {item.opportunity_title}
        </Text>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 3,
            backgroundColor: `${statusColor}18`,
            borderWidth: 1,
            borderColor: `${statusColor}40`,
          }}
        >
          <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
            {item.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {eventDate ? (
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>{eventDate}</Text>
        ) : null}
        {item.activity_type ? (
          <Text style={{ color: COLORS.muted, fontSize: 11 }}>
            {item.activity_type.replace(/_/g, ' ')}
          </Text>
        ) : null}
      </View>

      {(item.verification_level || item.verified_hours != null || item.points_awarded != null) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          {item.verification_level && verColor && (
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
                backgroundColor: `${verColor}18`,
                borderWidth: 1,
                borderColor: `${verColor}40`,
              }}
            >
              <Text style={{ color: verColor, fontSize: 10, fontWeight: '600' }}>
                {item.verification_level.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
          {item.verified_hours != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Clock size={11} color={COLORS.muted} />
              <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                {item.verified_hours}h
              </Text>
            </View>
          )}
          {item.points_awarded != null && item.points_awarded > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={11} color={COLORS.gold} />
              <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '600' }}>
                +{item.points_awarded}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
})

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function VolunteerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [allRegistrations, setAllRegistrations] = useState<VolunteerRegistrationHistory[]>([])
  const { data: profile, isLoading, isFetching } = useVolunteerProfile(id ?? '', page)

  useEffect(() => {
    if (!profile?.registrations) return
    setAllRegistrations((prev) => {
      if (page === 1) return profile.registrations
      const existingIds = new Set(prev.map((r) => r.id))
      const newItems = profile.registrations.filter((r) => !existingIds.has(r.id))
      return [...prev, ...newItems]
    })
  }, [profile?.registrations, page])

  const renderItem = useCallback(
    ({ item }: { item: VolunteerRegistrationHistory }) => <HistoryRow item={item} />,
    []
  )

  if (isLoading || !profile) {
    return <MaatramLoader />
  }

  const { volunteer, badges, totalHours, totalRegistrations, hasMoreRegistrations } = profile

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => safeGoBack(router)} hitSlop={8}>
          <ArrowLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 17, flex: 1 }} numberOfLines={1}>
          {volunteer.full_name}
        </Text>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 3,
            backgroundColor: `${COLORS.gold}20`,
            borderWidth: 1,
            borderColor: `${COLORS.gold}40`,
          }}
        >
          <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>
            Lvl {volunteer.level}
          </Text>
        </View>
      </View>

      <FlatList
        data={allRegistrations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Profile info */}
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 4 }}>
                {volunteer.email}
              </Text>
              {volunteer.phone && (
                <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 4 }}>
                  {volunteer.phone}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    backgroundColor: `${COLORS.muted}15`,
                    borderWidth: 1,
                    borderColor: `${COLORS.muted}30`,
                  }}
                >
                  <Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: '600' }}>
                    {volunteer.role.toUpperCase()}
                  </Text>
                </View>
                {volunteer.employer_org && (
                  <Text style={{ color: COLORS.muted, fontSize: 12, alignSelf: 'center' }}>
                    {volunteer.employer_org}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {volunteer.is_admin && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${COLORS.gold}20`, borderWidth: 1, borderColor: `${COLORS.gold}40` }}>
                    <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '700' }}>ADMIN</Text>
                  </View>
                )}
                {!volunteer.is_active && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${COLORS.error}15`, borderWidth: 1, borderColor: `${COLORS.error}40` }}>
                    <Text style={{ color: COLORS.error, fontSize: 10, fontWeight: '700' }}>INACTIVE</Text>
                  </View>
                )}
                {volunteer.do_not_contact && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${COLORS.error}15`, borderWidth: 1, borderColor: `${COLORS.error}40` }}>
                    <Text style={{ color: COLORS.error, fontSize: 10, fontWeight: '700' }}>DNC</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 8 }}>
                Joined {new Date(volunteer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <StatCard label="Points" value={volunteer.total_points.toLocaleString()} color={COLORS.gold} />
              <StatCard label="Hours" value={String(totalHours)} color={COLORS.white} />
              <StatCard label="Completed" value={String(volunteer.times_completed)} color={COLORS.success} />
              <StatCard label="Reliability" value={`${(volunteer.reliability_score * 100).toFixed(0)}%`} color={COLORS.white} />
            </View>

            {/* Badges */}
            {badges.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 }}>
                  BADGES
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {badges.map((b) => (
                    <View
                      key={b.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: `${COLORS.gold}15`,
                        borderWidth: 1,
                        borderColor: `${COLORS.gold}30`,
                      }}
                    >
                      <Award size={13} color={COLORS.gold} />
                      <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '600' }}>
                        {b.badge_name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Skills & Preferences */}
            {(volunteer.skills.length > 0 || volunteer.preferences.length > 0) && (
              <View style={{ marginBottom: 16 }}>
                {volunteer.skills.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 }}>
                      SKILLS
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {volunteer.skills.map((s) => (
                        <View
                          key={s}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: COLORS.surface,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                          }}
                        >
                          <Text style={{ color: COLORS.white, fontSize: 11 }}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {volunteer.preferences.length > 0 && (
                  <View>
                    <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 }}>
                      PREFERENCES
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {volunteer.preferences.map((p) => (
                        <View
                          key={p}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: COLORS.surface,
                            borderWidth: 1,
                            borderColor: COLORS.border,
                          }}
                        >
                          <Text style={{ color: COLORS.white, fontSize: 11 }}>{p.replace(/_/g, ' ')}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* History heading */}
            <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 }}>
              VOLUNTEERING HISTORY ({totalRegistrations})
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>
              No volunteering history yet.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMoreRegistrations ? (
            <TouchableOpacity
              onPress={() => setPage((p) => p + 1)}
              activeOpacity={0.7}
              style={{
                padding: 14,
                alignItems: 'center',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
                marginTop: 8,
              }}
            >
              {isFetching ? (
                <ActivityIndicator size="small" color={COLORS.gold} />
              ) : (
                <Text style={{ color: COLORS.gold, fontWeight: '600', fontSize: 14 }}>
                  Load More
                </Text>
              )}
            </TouchableOpacity>
          ) : undefined
        }
      />
    </SafeAreaView>
  )
}
