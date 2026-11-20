import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { safeGoBack } from '@/utils/navigation'
import {
  ChevronLeft,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import {
  useFairnessOverview,
  useOpportunityMetrics,
  useVolunteerDistribution,
} from '@/hooks/useFairness'
import { formatEventDate } from '@/utils'
import type { FairnessFilters } from '@/services/fairness.service'

type Period = '30d' | '90d' | 'all'

function periodToFilters(period: Period): FairnessFilters {
  if (period === 'all') return {}
  const now = new Date()
  const days = period === '30d' ? 30 : 90
  const from = new Date(now.getTime() - days * 86_400_000)
  return { dateFrom: from.toISOString() }
}

function MetricCard({
  label,
  value,
  subtitle,
  color,
  icon: Icon,
}: {
  label: string
  value: string
  subtitle?: string
  color?: string
  icon?: React.ComponentType<{ size: number; color: string }>
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 14,
        minWidth: '45%',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={14} color={color ?? COLORS.muted} />}
        <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '600', flex: 1 }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: color ?? COLORS.gold, fontWeight: '800', fontSize: 22 }}>{value}</Text>
      {subtitle && (
        <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 2 }}>{subtitle}</Text>
      )}
    </View>
  )
}

function RateBar({ label, rate, count, total }: { label: string; rate: number; count: number; total: number }) {
  const barColor =
    rate >= 75 ? COLORS.success : rate >= 40 ? COLORS.warning : COLORS.error
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          {rate.toFixed(1)}% ({count}/{total})
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: COLORS.surfaceElevated,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.min(rate, 100)}%`,
            borderRadius: 3,
            backgroundColor: barColor,
          }}
        />
      </View>
    </View>
  )
}

type Tab = 'overview' | 'opportunities' | 'volunteers'

export default function FairnessDashboardScreen() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('all')
  const [tab, setTab] = useState<Tab>('overview')
  const filters = useMemo(() => periodToFilters(period), [period])

  const { data: overview, isLoading: overviewLoading } = useFairnessOverview(filters)
  const { data: oppMetrics = [], isLoading: oppLoading } = useOpportunityMetrics(filters)
  const { data: volDist = [], isLoading: volLoading } = useVolunteerDistribution(filters)

  const isLoading =
    (tab === 'overview' && overviewLoading) ||
    (tab === 'opportunities' && oppLoading) ||
    (tab === 'volunteers' && volLoading)

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
          gap: 10,
        }}
      >
        <TouchableOpacity onPress={() => safeGoBack(router)} activeOpacity={0.7}>
          <ChevronLeft size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 18 }}>
            Fairness & Metrics
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            Allocation outcomes & access measurement
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['30d', '90d', 'all'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
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
                }}
              >
                {p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(
            [
              { key: 'overview', label: 'Overview', Icon: BarChart3 },
              { key: 'opportunities', label: 'By Event', Icon: Target },
              { key: 'volunteers', label: 'Volunteers', Icon: Users },
            ] as const
          ).map(({ key, label, Icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                backgroundColor: tab === key ? `${COLORS.gold}15` : COLORS.surface,
                borderColor: tab === key ? `${COLORS.gold}40` : COLORS.border,
              }}
            >
              <Icon size={14} color={tab === key ? COLORS.gold : COLORS.muted} />
              <Text
                style={{
                  color: tab === key ? COLORS.gold : COLORS.muted,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={COLORS.gold} />
            <Text style={{ color: COLORS.muted, marginTop: 10, fontSize: 13 }}>
              Computing metrics...
            </Text>
          </View>
        ) : tab === 'overview' && overview ? (
          <OverviewTab overview={overview} />
        ) : tab === 'opportunities' ? (
          <OpportunitiesTab metrics={oppMetrics} />
        ) : tab === 'volunteers' ? (
          <VolunteersTab distribution={volDist} />
        ) : (
          <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 40 }}>
            No data available for this period.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function OverviewTab({ overview }: { overview: NonNullable<ReturnType<typeof useFairnessOverview>['data']> }) {
  return (
    <View>
      {/* Summary cards */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <MetricCard
          label="Allocation Runs"
          value={String(overview.totalRuns)}
          icon={BarChart3}
        />
        <MetricCard
          label="Total Applicants"
          value={String(overview.totalApplicants)}
          icon={Users}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <MetricCard
          label="Selected"
          value={String(overview.totalSelected)}
          subtitle={`of ${overview.totalEligible} eligible`}
          color={COLORS.success}
          icon={CheckCircle}
        />
        <MetricCard
          label="Waitlisted"
          value={String(overview.totalWaitlisted)}
          icon={Clock}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <MetricCard
          label="Completed"
          value={String(overview.totalCompleted)}
          color={COLORS.success}
          icon={CheckCircle}
        />
        <MetricCard
          label="No-Shows"
          value={String(overview.totalNoShow)}
          color={COLORS.error}
          icon={XCircle}
        />
      </View>

      {/* Rate bars */}
      <Text
        style={{
          color: COLORS.white,
          fontWeight: '700',
          fontSize: 15,
          marginBottom: 14,
        }}
      >
        Key Rates
      </Text>

      <View
        style={{
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <RateBar
          label="Selection Rate"
          rate={overview.selectionRate}
          count={overview.totalSelected}
          total={overview.totalEligible}
        />
        <RateBar
          label="Fill Rate"
          rate={overview.fillRate}
          count={overview.filledSlots}
          total={overview.totalSlots}
        />
        <RateBar
          label="Completion Rate"
          rate={overview.completionRate}
          count={overview.totalCompleted}
          total={overview.totalSelected}
        />
        <RateBar
          label="No-Show Rate"
          rate={overview.noShowRate}
          count={overview.totalNoShow}
          total={overview.totalSelected}
        />
        <RateBar
          label="Cancellation Rate"
          rate={overview.cancellationRate}
          count={overview.totalCancelled}
          total={overview.totalSelected}
        />
        <RateBar
          label="Waitlist Conversion"
          rate={overview.waitlistConversion}
          count={Math.round(
            overview.totalWaitlisted > 0
              ? (overview.waitlistConversion / 100) * overview.totalWaitlisted
              : 0
          )}
          total={overview.totalWaitlisted}
        />
      </View>

      {/* First-timer insight */}
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <TrendingUp size={14} color={COLORS.gold} />
          <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>
            First-Time Volunteer Access
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View>
            <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 20 }}>
              {overview.firstTimeSelectionRate.toFixed(1)}%
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>selection rate</Text>
          </View>
          <View>
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 20 }}>
              {overview.firstTimeSelected}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>
              of {overview.firstTimeApplicants} selected
            </Text>
          </View>
        </View>
        {overview.firstTimeApplicants === 0 && (
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 8 }}>
            No first-time applicant data for this period.
          </Text>
        )}
        {overview.firstTimeApplicants > 0 && overview.firstTimeApplicants < 10 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              backgroundColor: `${COLORS.warning}15`,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <AlertTriangle size={11} color={COLORS.warning} />
            <Text style={{ color: COLORS.warning, fontSize: 11 }}>
              Small sample size — interpret with care
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

function OpportunitiesTab({
  metrics,
}: {
  metrics: ReturnType<typeof useOpportunityMetrics>['data']
}) {
  if (!metrics || metrics.length === 0) {
    return (
      <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 40 }}>
        No opportunities with allocation data.
      </Text>
    )
  }

  return (
    <View>
      <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 12 }}>
        {metrics.length} opportunities · sorted by date
      </Text>
      {metrics.map((m) => (
        <View
          key={m.opportunityId}
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}
          >
            <Text
              style={{ color: COLORS.white, fontWeight: '600', fontSize: 14, flex: 1 }}
              numberOfLines={1}
            >
              {m.title}
            </Text>
            {m.priority <= 2 && (
              <View
                style={{
                  backgroundColor: `${m.priority === 1 ? '#EF4444' : '#F97316'}20`,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: m.priority === 1 ? '#EF4444' : '#F97316',
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  P{m.priority}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 8 }}>
            {formatEventDate(m.eventDate)} · {m.activityType.replace(/_/g, ' ')}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <MiniStat label="Slots" value={`${m.selected}/${m.totalSlots}`} />
            <MiniStat label="Fill" value={`${m.fillRate.toFixed(0)}%`} />
            <MiniStat label="Applicants" value={String(m.applicants)} />
            <MiniStat label="Sel. Rate" value={`${m.selectionRate.toFixed(0)}%`} />
            <MiniStat label="Completed" value={String(m.completed)} />
            <MiniStat label="No-Show" value={String(m.noShow)} />
          </View>
        </View>
      ))}
    </View>
  )
}

function VolunteersTab({
  distribution,
}: {
  distribution: ReturnType<typeof useVolunteerDistribution>['data']
}) {
  if (!distribution || distribution.length === 0) {
    return (
      <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 40 }}>
        No volunteer data for this period.
      </Text>
    )
  }

  const maxSelected = Math.max(...distribution.map((v) => v.timesSelected), 1)

  return (
    <View>
      <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 12 }}>
        {distribution.length} volunteers · sorted by selections
      </Text>
      {distribution.map((v) => (
        <View
          key={v.volunteerId}
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 14,
            padding: 14,
            marginBottom: 8,
          }}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}
          >
            <Text
              style={{ color: COLORS.white, fontWeight: '600', fontSize: 13, flex: 1 }}
              numberOfLines={1}
            >
              {v.name}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>
              {v.selectionRate.toFixed(0)}% sel. rate
            </Text>
          </View>

          {/* Distribution bar */}
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.surfaceElevated,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${(v.timesSelected / maxSelected) * 100}%`,
                borderRadius: 3,
                backgroundColor: COLORS.gold,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <MiniStat label="Applied" value={String(v.applicationsCount)} />
            <MiniStat label="Selected" value={String(v.timesSelected)} />
            <MiniStat label="Completed" value={String(v.timesCompleted)} />
            {v.timesNoShow > 0 && (
              <MiniStat label="No-Show" value={String(v.timesNoShow)} color={COLORS.error} />
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <View>
      <Text style={{ color: color ?? COLORS.white, fontWeight: '700', fontSize: 14 }}>
        {value}
      </Text>
      <Text style={{ color: COLORS.muted, fontSize: 10 }}>{label}</Text>
    </View>
  )
}
