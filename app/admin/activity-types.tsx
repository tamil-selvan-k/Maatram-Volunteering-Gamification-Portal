import React, { useState, useCallback, memo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Plus, Trash2 } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import {
  useActivityTypes,
  useCreateActivityType,
  useDeleteActivityType,
} from '@/hooks/useAdmin'
import type { ActivityTypeRow } from '@/services/admin.service'

// ─── Preset accent colors ─────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#EAB308', // yellow
  '#F97316', // orange
  '#EF4444', // red
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#06B6D4', // cyan
  '#22C55E', // green
  '#6B7280', // gray
  '#F5B800', // gold
]

// ─── Slugify helper ───────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
}

// ─── Activity type row ────────────────────────────────────────────────────────

const ActivityTypeItem = memo(function ActivityTypeItem({
  item,
}: {
  item: ActivityTypeRow
}) {
  const { mutate: deleteType, isPending } = useDeleteActivityType()

  const handleDelete = () => {
    Alert.alert(
      'Remove Activity Type',
      `Remove "${item.label}"? It will be hidden from forms but historical data is preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            deleteType(item.id, {
              onError: () => Alert.alert('Error', 'Failed to remove activity type.'),
            }),
        },
      ]
    )
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
      }}
    >
      {/* Accent dot */}
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: item.accent,
          marginRight: 12,
        }}
      />

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 14 }}>
          {item.label}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{item.key}</Text>
      </View>

      {/* Delete */}
      <TouchableOpacity
        onPress={handleDelete}
        disabled={isPending}
        activeOpacity={0.7}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: `${COLORS.error}40`,
          backgroundColor: `${COLORS.error}10`,
          opacity: isPending ? 0.5 : 1,
        }}
      >
        <Trash2 size={14} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  )
})

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddTypeForm({ onDismiss }: { onDismiss: () => void }) {
  const [label, setLabel] = useState('')
  const [accent, setAccent] = useState<string>(PRESET_COLORS[0] ?? '#6B7280')
  const { mutate: createType, isPending } = useCreateActivityType()

  const derivedKey = slugify(label)

  const handleSubmit = () => {
    if (!label.trim()) {
      Alert.alert('Required', 'Label is required.')
      return
    }
    if (!derivedKey) {
      Alert.alert('Invalid', 'Label must contain at least one letter or number.')
      return
    }
    createType(
      { key: derivedKey, label: label.trim(), accent },
      {
        onSuccess: () => {
          setLabel('')
          setAccent(PRESET_COLORS[0] ?? '#6B7280')
          onDismiss()
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Failed to create activity type.'
          Alert.alert('Error', msg)
        },
      }
    )
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.borderStrong,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          color: COLORS.white,
          fontWeight: '700',
          fontSize: 15,
          marginBottom: 14,
        }}
      >
        Add Activity Type
      </Text>

      {/* Label */}
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        LABEL *
      </Text>
      <TextInput
        style={{
          backgroundColor: COLORS.bgSecondary,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: COLORS.white,
          fontSize: 14,
          marginBottom: 4,
        }}
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. Field Survey"
        placeholderTextColor={COLORS.muted}
        autoCapitalize="words"
      />
      {derivedKey ? (
        <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 14 }}>
          key: {derivedKey}
        </Text>
      ) : (
        <View style={{ marginBottom: 14 }} />
      )}

      {/* Accent color */}
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          marginBottom: 8,
        }}
      >
        ACCENT COLOR
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4, marginBottom: 16 }}
      >
        {PRESET_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => setAccent(color)}
            activeOpacity={0.7}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: color,
              borderWidth: accent === color ? 3 : 1,
              borderColor: accent === color ? COLORS.white : `${color}60`,
            }}
          />
        ))}
      </ScrollView>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={onDismiss}
          disabled={isPending}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 11,
            borderRadius: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.bgSecondary,
          }}
        >
          <Text style={{ color: COLORS.muted, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isPending}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: 11,
            borderRadius: 10,
            alignItems: 'center',
            backgroundColor: isPending ? `${COLORS.gold}60` : COLORS.gold,
          }}
        >
          {isPending ? (
            <ActivityIndicator color={COLORS.bg} size="small" />
          ) : (
            <Text style={{ color: COLORS.bg, fontWeight: '800', fontSize: 14 }}>Add</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ActivityTypesScreen() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const { data: types = [], isLoading } = useActivityTypes()

  const renderItem = useCallback(
    ({ item }: { item: ActivityTypeRow }) => <ActivityTypeItem item={item} />,
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
          Activity Types
        </Text>
        <TouchableOpacity
          onPress={() => setShowForm((v) => !v)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: COLORS.gold,
            backgroundColor: `${COLORS.gold}15`,
          }}
        >
          <Plus size={14} color={COLORS.gold} />
          <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 13 }}>Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={types}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showForm ? (
              <AddTypeForm onDismiss={() => setShowForm(false)} />
            ) : undefined
          }
          ListEmptyComponent={
            !showForm ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 48,
                }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center' }}>
                  No activity types yet.{'\n'}Run migration 006 to seed them.
                </Text>
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  )
}
