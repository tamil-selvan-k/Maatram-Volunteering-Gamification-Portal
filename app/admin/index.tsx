import React, { useState, useCallback, memo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { COLORS } from '@/constants/theme'
import { useAdminStats, useAdminOpportunities, useActivityReport } from '@/hooks/useAdmin'
import type { AdminOpportunityRow } from '@/services/admin.service'
import { formatEventDate } from '@/utils'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 22 }}>{value}</Text>
      <Text
        style={{ color: COLORS.muted, fontSize: 11, marginTop: 3, textAlign: 'center' }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  open:                 COLORS.success,
  registration_closed:  COLORS.warning,
  allocated:            '#8B5CF6',
  in_progress:          COLORS.gold,
  completed:            COLORS.muted,
  cancelled:            COLORS.error,
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? COLORS.muted
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: `${color}20`,
        borderWidth: 1,
        borderColor: `${color}50`,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </Text>
    </View>
  )
}

// ─── Opportunity row ──────────────────────────────────────────────────────────

const OpportunityRow = memo(function OpportunityRow({
  item,
  onPress,
}: {
  item: AdminOpportunityRow
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text
            style={{ color: COLORS.white, fontWeight: '600', fontSize: 14, marginBottom: 4 }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>
            {formatEventDate(item.event_date)} · {item.activity_type.replace(/_/g, ' ')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>
              {item.registrations_count} registered
            </Text>
            <Text style={{ color: COLORS.success, fontSize: 11 }}>
              {item.verified_count} verified
            </Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
    </TouchableOpacity>
  )
})

// ─── Report modal ─────────────────────────────────────────────────────────────

type ReportPeriod = 'month' | 'quarter' | 'all'

function ReportModal({
  visible,
  onClose,
  period,
  setPeriod,
}: {
  visible: boolean
  onClose: () => void
  period: ReportPeriod
  setPeriod: (p: ReportPeriod) => void
}) {
  const { data: report, isLoading, refetch } = useActivityReport(period, visible)

  const handleCopy = async () => {
    if (!report) return
    await Clipboard.setStringAsync(JSON.stringify(report, null, 2))
    Alert.alert('Copied', 'Report JSON copied to clipboard.')
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 17 }}>
            Activity Report
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={{ color: COLORS.gold, fontSize: 15, fontWeight: '600' }}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Period selector */}
        <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }}>
          {(['month', 'quarter', 'all'] as ReportPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => {
                setPeriod(p)
                void refetch()
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                borderWidth: 1,
                backgroundColor: period === p ? `${COLORS.gold}20` : COLORS.surface,
                borderColor: period === p ? `${COLORS.gold}50` : COLORS.border,
              }}
            >
              <Text
                style={{
                  color: period === p ? COLORS.gold : COLORS.muted,
                  fontSize: 13,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.gold} />
            <Text style={{ color: COLORS.muted, marginTop: 10 }}>Generating report…</Text>
          </View>
        ) : !report ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: COLORS.muted, textAlign: 'center' }}>
              No data available for this period.
            </Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>
                Generated: {new Date(report.generated_at).toLocaleString()}
              </Text>
              <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '600' }}>
                {report.volunteers.length} active volunteer{report.volunteers.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {report.volunteers.map((vol) => (
              <View
                key={vol.volunteer_id}
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
                  {vol.volunteer_name}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>
                  {vol.volunteer_email}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View>
                    <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 16 }}>
                      {vol.events_completed}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11 }}>events</Text>
                  </View>
                  <View>
                    <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 16 }}>
                      {vol.hours_volunteered}h
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11 }}>hours</Text>
                  </View>
                  <View>
                    <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 16 }}>
                      {vol.points_earned}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11 }}>points</Text>
                  </View>
                </View>
                {vol.badges_earned.length > 0 && (
                  <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 6 }}>
                    Badges: {vol.badges_earned.join(', ')}
                  </Text>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={handleCopy}
              activeOpacity={0.7}
              style={{
                marginTop: 8,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.gold,
                alignItems: 'center',
                backgroundColor: `${COLORS.gold}10`,
              }}
            >
              <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 15 }}>
                Copy JSON
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}

// ─── Main admin screen ────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [reportVisible, setReportVisible] = useState(false)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month')

  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: oppsResult, isLoading: oppsLoading } = useAdminOpportunities(page)

  const handleRowPress = useCallback(
    (id: string) => {
      router.push(`/admin/opportunity/${id}` as never)
    },
    [router]
  )

  const handleLoadMore = () => {
    if (oppsResult?.hasMore) setPage((p) => p + 1)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        data={oppsResult?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View>
                <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 22 }}>
                  Admin Dashboard
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>
                  Maatram Foundation
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportVisible(true)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.gold,
                  backgroundColor: `${COLORS.gold}15`,
                }}
              >
                <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 13 }}>
                  Export Report
                </Text>
              </TouchableOpacity>
            </View>

            {/* Stats cards */}
            {statsLoading ? (
              <ActivityIndicator color={COLORS.gold} style={{ marginBottom: 20 }} />
            ) : (
              <View style={{ gap: 10, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <StatCard
                    label="Total Volunteers"
                    value={stats?.totalVolunteers ?? 0}
                  />
                  <StatCard
                    label="Events This Month"
                    value={stats?.eventsCompletedThisMonth ?? 0}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <StatCard
                    label="Points Awarded (Month)"
                    value={(stats?.pointsAwardedThisMonth ?? 0).toLocaleString()}
                  />
                  <StatCard
                    label="Avg Reliability"
                    value={`${stats?.avgReliabilityScore?.toFixed(2) ?? '0.00'}%`}
                  />
                </View>
              </View>
            )}

            {/* Opportunities heading */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>
                Opportunities
              </Text>
              {oppsResult && (
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                  {oppsResult.total} total
                </Text>
              )}
            </View>

            {oppsLoading && page === 1 && (
              <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 20 }} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <OpportunityRow item={item} onPress={() => handleRowPress(item.id)} />
        )}
        ListFooterComponent={
          oppsResult?.hasMore ? (
            <TouchableOpacity
              onPress={handleLoadMore}
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
              <Text style={{ color: COLORS.gold, fontWeight: '600', fontSize: 14 }}>
                Load More
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        period={reportPeriod}
        setPeriod={setReportPeriod}
      />
    </SafeAreaView>
  )
}
