import React, { memo, useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, type ListRenderItem } from 'react-native'
import { Check, UserCheck } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import { Button } from '@/components/ui/Button'
import { getInitials } from '@/utils'
import type { PeerEntry } from '@/services/verification.service'

// ─── Row component ────────────────────────────────────────────────────────────

interface PeerRowProps {
  entry: PeerEntry
  selected: boolean
  onToggle: (id: string) => void
}

const PeerRow = memo(function PeerRow({ entry, selected, onToggle }: PeerRowProps) {
  const handlePress = useCallback(() => onToggle(entry.id), [entry.id, onToggle])

  return (
    <TouchableOpacity
      onPress={entry.confirmed ? undefined : handlePress}
      activeOpacity={entry.confirmed ? 1 : 0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 12,
      }}
    >
      {/* Avatar initials */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: COLORS.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: entry.confirmed ? COLORS.success + '60' : COLORS.border,
        }}
      >
        <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '700' }}>
          {getInitials(entry.full_name)}
        </Text>
      </View>

      {/* Name */}
      <Text style={{ flex: 1, color: COLORS.white, fontSize: 14, fontWeight: '500' }}>
        {entry.full_name}
      </Text>

      {/* Status indicator */}
      {entry.confirmed ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: COLORS.success + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <UserCheck size={12} color={COLORS.success} />
          <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: '600' }}>
            Confirmed
          </Text>
        </View>
      ) : (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? COLORS.gold : COLORS.borderStrong,
            backgroundColor: selected ? COLORS.gold + '20' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <Check size={12} color={COLORS.gold} strokeWidth={3} />}
        </View>
      )}
    </TouchableOpacity>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

interface PeerConfirmListProps {
  peers: PeerEntry[]
  isSubmitting: boolean
  onSubmit: (selectedIds: string[]) => void
}

export const PeerConfirmList = memo(function PeerConfirmList({
  peers,
  isSubmitting,
  onSubmit,
}: PeerConfirmListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const togglePeer = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(Array.from(selected))
  }, [onSubmit, selected])

  const renderItem: ListRenderItem<PeerEntry> = useCallback(
    ({ item }) => (
      <PeerRow
        entry={item}
        selected={selected.has(item.id)}
        onToggle={togglePeer}
      />
    ),
    [selected, togglePeer]
  )

  const pendingCount = peers.filter((p) => !p.confirmed).length

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: COLORS.surfaceElevated,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 15 }}>
          Confirm who was present
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
          {selected.size} selected · {peers.length - pendingCount} already confirmed
        </Text>
      </View>

      {peers.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ color: COLORS.muted, fontSize: 14 }}>
            No other attendees to confirm
          </Text>
        </View>
      ) : (
        <FlatList
          data={peers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Submit button */}
      {pendingCount > 0 && (
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <Button
            title={`Confirm ${selected.size} volunteer${selected.size !== 1 ? 's' : ''}`}
            onPress={handleSubmit}
            disabled={selected.size === 0}
            loading={isSubmitting}
          />
        </View>
      )}
    </View>
  )
})
