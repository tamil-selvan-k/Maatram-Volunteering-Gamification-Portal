import React, { useState, useCallback, memo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/theme'
import { confirmAction, showAlert } from '@/lib/alert'
import { useVolunteers, useUpdateVolunteerAdmin } from '@/hooks/useAdmin'
import type { Volunteer } from '@/types'

// ─── Level badge ──────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: number }) {
  return (
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
        Lvl {level}
      </Text>
    </View>
  )
}

// ─── Volunteer row ────────────────────────────────────────────────────────────

const VolunteerRow = memo(function VolunteerRow({ item }: { item: Volunteer }) {
  const { mutate: updateAdmin, isPending } = useUpdateVolunteerAdmin()

  const toggle = (field: 'is_admin' | 'do_not_contact' | 'is_active', value: boolean) => {
    const labels = {
      is_admin:       value ? 'Grant admin access' : 'Revoke admin access',
      do_not_contact: value ? 'Mark Do Not Contact' : 'Remove Do Not Contact flag',
      is_active:      value ? 'Reactivate volunteer' : 'Deactivate volunteer',
    } as const
    const label = labels[field]
    confirmAction(
      label,
      `${label} for ${item.full_name}?`,
      () =>
        updateAdmin(
          { id: item.id, updates: { [field]: value } },
          { onError: () => showAlert('Error', 'Failed to update volunteer.') }
        ),
      { destructive: field === 'is_active' && !value }
    )
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {/* Top row: name + level + role */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <Text
          style={{ color: COLORS.white, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 }}
          numberOfLines={1}
        >
          {item.full_name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <LevelBadge level={item.level} />
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
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Email */}
      <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 12 }} numberOfLines={1}>
        {item.email}
      </Text>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
        <View>
          <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 14 }}>
            {item.total_points.toLocaleString()}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 10 }}>pts</Text>
        </View>
        <View>
          <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14 }}>
            {item.times_completed}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 10 }}>completed</Text>
        </View>
        <View>
          <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14 }}>
            {(item.reliability_score * 100).toFixed(0)}%
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 10 }}>reliability</Text>
        </View>
      </View>

      {/* Toggle row */}
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 10,
          gap: 4,
        }}
      >
        {(
          [
            { field: 'is_admin',       label: 'Admin',   value: item.is_admin,       color: COLORS.gold },
            { field: 'is_active',      label: 'Active',  value: item.is_active,      color: COLORS.success },
            { field: 'do_not_contact', label: 'DNC',     value: item.do_not_contact, color: COLORS.error },
          ] as const
        ).map(({ field, label, value, color }) => (
          <View
            key={field}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: `${color}08`,
              borderWidth: 1,
              borderColor: `${color}20`,
            }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>{label}</Text>
            <Switch
              value={value}
              onValueChange={(v) => toggle(field, v)}
              disabled={isPending}
              trackColor={{ false: COLORS.border, true: `${color}60` }}
              thumbColor={value ? color : COLORS.muted}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        ))}
      </View>
    </View>
  )
})

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VolunteersScreen() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Simple debounce: reset page when search changes
  const handleSearch = (text: string) => {
    setSearch(text)
    setPage(1)
    setDebouncedSearch(text)
  }

  const { data: result, isLoading } = useVolunteers(page, debouncedSearch || undefined)

  const renderItem = useCallback(
    ({ item }: { item: Volunteer }) => <VolunteerRow item={item} />,
    []
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
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
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ color: COLORS.gold, fontSize: 15, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 17 }}>
          Volunteers
        </Text>
        {result ? (
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>{result.total} total</Text>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {/* Search */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <TextInput
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 11,
            color: COLORS.white,
            fontSize: 14,
          }}
          value={search}
          onChangeText={handleSearch}
          placeholder="Search by name or email…"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading && page === 1 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={result?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 32 }}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 48,
                }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 15 }}>
                  {debouncedSearch ? 'No volunteers match your search.' : 'No volunteers yet.'}
                </Text>
              </View>
            ) : undefined
          }
          ListFooterComponent={
            result?.hasMore ? (
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
                {isLoading ? (
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
      )}
    </SafeAreaView>
  )
}
