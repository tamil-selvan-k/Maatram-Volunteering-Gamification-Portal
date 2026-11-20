import React, { useState, useCallback, memo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, Check, AlertTriangle } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import { useAdminOpportunities, useBatchAllocation } from '@/hooks/useAdmin'
import { useAuthStore } from '@/stores/auth.store'
import { showAlert } from '@/lib/alert'
import { formatEventDate } from '@/utils'
import type { AdminOpportunityRow } from '@/services/admin.service'
import type { BatchAllocationSummary } from '@/services/batch-allocation.service'

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Normal',
  4: 'Low',
  5: 'Backfill',
}

function PriorityBadge({ priority }: { priority: number }) {
  const colors: Record<number, string> = {
    1: COLORS.error,
    2: COLORS.warning,
    3: COLORS.gold,
    4: COLORS.muted,
    5: COLORS.muted,
  }
  const color = colors[priority] ?? COLORS.muted
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: `${color}20`,
        borderWidth: 1,
        borderColor: `${color}50`,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>
        P{priority} {PRIORITY_LABELS[priority] ?? ''}
      </Text>
    </View>
  )
}

const OpportunityCheckRow = memo(function OpportunityCheckRow({
  item,
  selected,
  onToggle,
}: {
  item: AdminOpportunityRow & { priority?: number }
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <TouchableOpacity
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
      style={{
        backgroundColor: selected ? `${COLORS.gold}10` : COLORS.surface,
        borderWidth: 1,
        borderColor: selected ? `${COLORS.gold}50` : COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: selected ? COLORS.gold : COLORS.border,
          backgroundColor: selected ? COLORS.gold : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {selected && <Check size={14} color={COLORS.bg} strokeWidth={3} />}
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <Text
            style={{ color: COLORS.white, fontWeight: '600', fontSize: 14, flex: 1, marginRight: 8 }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <PriorityBadge priority={(item as { priority?: number }).priority ?? 3} />
        </View>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
          {formatEventDate(item.event_date)} · {item.activity_type.replace(/_/g, ' ')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={{ color: COLORS.muted, fontSize: 11 }}>
            {item.registrations_count} registered
          </Text>
          <Text style={{ color: COLORS.success, fontSize: 11 }}>
            {item.verified_count} verified
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
})

function ResultsView({ summary }: { summary: BatchAllocationSummary }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16, marginBottom: 12 }}>
          Allocation Summary
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 24 }}>
              {summary.totalAssigned}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>Assigned</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: COLORS.warning, fontWeight: '800', fontSize: 24 }}>
              {summary.totalUnfilled}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>Unfilled</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 24 }}>
              {summary.perOpportunity.length}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>Opportunities</Text>
          </View>
        </View>
      </View>

      {summary.perOpportunity.map((opp) => (
        <View
          key={opp.opportunityId}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{ color: COLORS.white, fontWeight: '600', fontSize: 14, marginBottom: 8 }}
            numberOfLines={2}
          >
            {opp.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View>
              <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 16 }}>
                {opp.selected}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 11 }}>Selected</Text>
            </View>
            <View>
              <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 16 }}>
                {opp.waitlisted}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 11 }}>Waitlisted</Text>
            </View>
            {opp.unfilled > 0 && (
              <View>
                <Text style={{ color: COLORS.warning, fontWeight: '700', fontSize: 16 }}>
                  {opp.unfilled}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 11 }}>Unfilled</Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {summary.runIds.length > 0 && (
        <View
          style={{
            backgroundColor: `${COLORS.success}15`,
            borderRadius: 12,
            padding: 14,
            marginTop: 6,
            borderWidth: 1,
            borderColor: `${COLORS.success}40`,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={16} color={COLORS.success} />
          <Text style={{ color: COLORS.success, fontSize: 13, fontWeight: '600' }}>
            Allocation committed successfully
          </Text>
        </View>
      )}

      {summary.runIds.length === 0 && (
        <View
          style={{
            backgroundColor: `${COLORS.gold}15`,
            borderRadius: 12,
            padding: 14,
            marginTop: 6,
            borderWidth: 1,
            borderColor: `${COLORS.gold}40`,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} color={COLORS.gold} />
          <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '600' }}>
            Preview only -- not committed
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

export default function BatchAllocateScreen() {
  const router = useRouter()
  const volunteer = useAuthStore((s) => s.volunteer)
  const [page] = useState(1)
  const { data: oppsResult, isLoading: oppsLoading } = useAdminOpportunities(page, 100)
  const batchMutation = useBatchAllocation()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [summary, setSummary] = useState<BatchAllocationSummary | null>(null)

  const openOpps = (oppsResult?.items ?? []).filter(
    (o) => o.status === 'open' || o.status === 'registration_closed' || o.status === 'allocated'
  )

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelectAll = () => {
    if (selectedIds.size === openOpps.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(openOpps.map((o) => o.id)))
    }
  }

  const handlePreview = async () => {
    if (selectedIds.size === 0) {
      showAlert('No Selection', 'Select at least one opportunity to preview.')
      return
    }
    try {
      const result = await batchMutation.mutateAsync({
        opportunityIds: [...selectedIds],
        adminId: volunteer?.id ?? '',
        isDryRun: true,
      })
      setSummary(result)
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Preview failed')
    }
  }

  const handleRun = async () => {
    if (selectedIds.size === 0) {
      showAlert('No Selection', 'Select at least one opportunity to allocate.')
      return
    }
    try {
      const result = await batchMutation.mutateAsync({
        opportunityIds: [...selectedIds],
        adminId: volunteer?.id ?? '',
        isDryRun: false,
      })
      setSummary(result)
    } catch (err) {
      showAlert('Error', err instanceof Error ? err.message : 'Allocation failed')
    }
  }

  const handleBack = () => {
    if (summary) {
      setSummary(null)
    } else {
      router.back()
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 18 }}>
              {summary ? 'Allocation Results' : 'Batch Allocate'}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 1 }}>
              {summary
                ? `${summary.perOpportunity.length} opportunities`
                : `${selectedIds.size} selected`}
            </Text>
          </View>
        </View>
      </View>

      {summary ? (
        <ResultsView summary={summary} />
      ) : (
        <>
          {oppsLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={COLORS.gold} />
              <Text style={{ color: COLORS.muted, marginTop: 10, fontSize: 13 }}>
                Loading opportunities...
              </Text>
            </View>
          ) : openOpps.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Text style={{ color: COLORS.muted, textAlign: 'center', fontSize: 14 }}>
                No open opportunities available for batch allocation.
              </Text>
            </View>
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                  {openOpps.length} opportunities
                </Text>
                <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
                  <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: '600' }}>
                    {selectedIds.size === openOpps.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={openOpps}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <OpportunityCheckRow
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggle={handleToggle}
                  />
                )}
              />

              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
                  paddingBottom: 32,
                  backgroundColor: COLORS.bg,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.border,
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  onPress={handlePreview}
                  disabled={batchMutation.isPending || selectedIds.size === 0}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor:
                      selectedIds.size === 0 ? COLORS.border : COLORS.gold,
                    backgroundColor:
                      selectedIds.size === 0 ? COLORS.surface : `${COLORS.gold}15`,
                    alignItems: 'center',
                  }}
                >
                  {batchMutation.isPending ? (
                    <ActivityIndicator color={COLORS.gold} size="small" />
                  ) : (
                    <Text
                      style={{
                        color: selectedIds.size === 0 ? COLORS.muted : COLORS.gold,
                        fontWeight: '700',
                        fontSize: 15,
                      }}
                    >
                      Preview
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRun}
                  disabled={batchMutation.isPending || selectedIds.size === 0}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor:
                      selectedIds.size === 0 ? COLORS.surface : COLORS.gold,
                    alignItems: 'center',
                  }}
                >
                  {batchMutation.isPending ? (
                    <ActivityIndicator color={COLORS.bg} size="small" />
                  ) : (
                    <Text
                      style={{
                        color: selectedIds.size === 0 ? COLORS.muted : COLORS.bg,
                        fontWeight: '700',
                        fontSize: 15,
                      }}
                    >
                      Run Allocation
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  )
}
