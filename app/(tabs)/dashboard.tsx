import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Trash2, Edit3, Clock, X } from 'lucide-react-native'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import {
  useMyAvailability,
  useCreateAvailability,
  useUpdateAvailability,
  useDeleteAvailability,
} from '@/hooks/useAvailability'
import { confirmAction, showAlert } from '@/lib/alert'
import { COLORS } from '@/constants/theme'
import { Skeleton } from '@/components/ui/Skeleton'
import type { VolunteerAvailability, AvailabilityType, AvailabilityStatus } from '@/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const MODE_OPTIONS = [
  { label: 'Any', value: 'any' as const },
  { label: 'Online', value: 'online' as const },
  { label: 'Offline', value: 'offline' as const },
]

const STATUS_OPTIONS = [
  { label: 'Available', value: 'available' as const },
  { label: 'Tentative', value: 'tentative' as const },
]

type ModePreference = 'online' | 'offline' | 'any'

interface FormState {
  type: AvailabilityType
  days_of_week: number[]
  specific_date: string
  start_time: string
  end_time: string
  mode_preference: ModePreference
  status: AvailabilityStatus
}

const INITIAL_FORM: FormState = {
  type: 'recurring',
  days_of_week: [1],
  specific_date: '',
  start_time: '09:00',
  end_time: '17:00',
  mode_preference: 'any',
  status: 'available',
}

function formatTime(time: string) {
  const [h = '0', m = '00'] = time.split(':')
  const hour = parseInt(h, 10)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${display}:${m} ${suffix}`
}

function statusColor(status: AvailabilityStatus) {
  switch (status) {
    case 'available':
      return COLORS.success
    case 'tentative':
      return COLORS.warning
    case 'unavailable':
      return COLORS.error
  }
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View className="flex-row bg-surface-elevated rounded-xl overflow-hidden">
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className="flex-1 py-2.5 items-center"
          style={
            value === opt.value
              ? { backgroundColor: COLORS.gold }
              : undefined
          }
        >
          <Text
            style={{
              color: value === opt.value ? '#000' : COLORS.muted,
              fontWeight: value === opt.value ? '700' : '500',
              fontSize: 13,
            }}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function AvailabilityCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: VolunteerAvailability
  onEdit: () => void
  onDelete: () => void
}) {
  const dayLabel =
    entry.type === 'recurring'
      ? DAY_FULL_NAMES[entry.day_of_week ?? 0]
      : entry.specific_date ?? ''

  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColor(entry.status),
            }}
          />
          <Text className="text-white font-semibold text-sm">
            {dayLabel}
          </Text>
          <View className="bg-surface-elevated rounded-lg px-2 py-0.5">
            <Text className="text-muted text-xs">
              {entry.type === 'recurring' ? 'Weekly' : 'One-time'}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <Pressable onPress={onEdit} hitSlop={8}>
            <Edit3 size={16} color={COLORS.muted} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8}>
            <Trash2 size={16} color={COLORS.error} />
          </Pressable>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <Clock size={14} color={COLORS.muted} />
        <Text className="text-muted text-sm">
          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
        </Text>
        <View className="bg-surface-elevated rounded-lg px-2 py-0.5 ml-1">
          <Text className="text-muted text-xs capitalize">
            {entry.mode_preference === 'any' ? 'Any mode' : entry.mode_preference}
          </Text>
        </View>
      </View>
    </View>
  )
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <View className="flex-1">
      <Text className="text-muted text-xs mb-1">{label}</Text>
      <TextInput
        className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-white text-sm"
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor={COLORS.muted}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  )
}

export default function DashboardScreen() {
  const volunteer = useAuthStore(selectVolunteer)
  const { data: entries = [], isLoading } = useMyAvailability()
  const createMutation = useCreateAvailability()
  const updateMutation = useUpdateAvailability()
  const deleteMutation = useDeleteAvailability()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [maxHours, setMaxHours] = useState('')

  const openCreate = () => {
    setEditingId(null)
    setForm(INITIAL_FORM)
    setShowForm(true)
  }

  const openEdit = (entry: VolunteerAvailability) => {
    setEditingId(entry.id)
    setForm({
      type: entry.type,
      days_of_week: entry.day_of_week != null ? [entry.day_of_week] : [1],
      specific_date: entry.specific_date ?? '',
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5),
      mode_preference: entry.mode_preference,
      status: entry.status,
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    confirmAction(
      'Delete availability',
      'Are you sure you want to remove this availability slot?',
      () => deleteMutation.mutate(id),
      { destructive: true, confirmLabel: 'Delete' }
    )
  }

  const validateForm = (): boolean => {
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(form.start_time) || !timeRegex.test(form.end_time)) {
      showAlert('Invalid time', 'Use HH:MM format (e.g. 09:00).')
      return false
    }
    if (form.start_time >= form.end_time) {
      showAlert('Invalid time range', 'End time must be after start time.')
      return false
    }
    if (form.type === 'recurring' && form.days_of_week.length === 0) {
      showAlert('No days selected', 'Select at least one day of the week.')
      return false
    }
    if (form.type === 'exception' && !form.specific_date) {
      showAlert('Missing date', 'Please enter a date for this exception (YYYY-MM-DD).')
      return false
    }
    return true
  }

  const handleSave = () => {
    if (!volunteer) return
    if (!validateForm()) return

    const basePayload = {
      volunteer_id: volunteer.id,
      type: form.type,
      start_time: form.start_time,
      end_time: form.end_time,
      timezone: 'Asia/Kolkata',
      status: form.status,
      mode_preference: form.mode_preference,
      max_weekly_hours: maxHours ? parseFloat(maxHours) : null,
    }

    setShowForm(false)

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        updates: {
          ...basePayload,
          day_of_week: form.type === 'recurring' ? form.days_of_week[0] ?? null : null,
          specific_date: form.type === 'exception' ? form.specific_date : null,
        },
      })
    } else if (form.type === 'recurring') {
      for (const day of form.days_of_week) {
        createMutation.mutate({ ...basePayload, day_of_week: day, specific_date: null })
      }
    } else {
      createMutation.mutate({ ...basePayload, day_of_week: null, specific_date: form.specific_date })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white font-bold text-xl mb-1">My Availability</Text>
        <Text className="text-muted text-sm mb-5">
          Set when you are available to volunteer
        </Text>

        {/* Max weekly hours */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-5 flex-row items-center justify-between">
          <Text className="text-white font-semibold text-sm">Max weekly hours</Text>
          <TextInput
            className="bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-white text-sm text-center"
            style={{ width: 72 }}
            value={maxHours}
            onChangeText={setMaxHours}
            placeholder="--"
            placeholderTextColor={COLORS.muted}
            keyboardType="numeric"
          />
        </View>

        {/* Entries list */}
        {isLoading ? (
          <View className="gap-3">
            <Skeleton height={80} />
            <Skeleton height={80} />
          </View>
        ) : entries.length === 0 ? (
          <View className="bg-surface border border-border rounded-2xl p-6 items-center mb-5">
            <Clock size={32} color={COLORS.muted} />
            <Text className="text-white font-semibold text-sm text-center mt-3 mb-1">
              No availability set
            </Text>
            <Text className="text-muted text-xs text-center">
              Add your weekly schedule so we can match you to the right opportunities.
            </Text>
          </View>
        ) : (
          <View className="mb-3">
            {entries.map((entry) => (
              <AvailabilityCard
                key={entry.id}
                entry={entry}
                onEdit={() => openEdit(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </View>
        )}

        {/* Add button */}
        <Pressable
          onPress={openCreate}
          className="bg-gold rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
        >
          <Plus size={18} color="#000" strokeWidth={3} />
          <Text style={{ color: '#000', fontWeight: '700', fontSize: 15 }}>
            Add Availability
          </Text>
        </Pressable>
      </ScrollView>

      {/* Form modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-bg rounded-t-3xl p-5 pb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white font-bold text-lg">
                {editingId ? 'Edit Availability' : 'Add Availability'}
              </Text>
              <Pressable onPress={() => setShowForm(false)} hitSlop={8}>
                <X size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            {/* Type selector */}
            <Text className="text-muted text-xs mb-1.5">Type</Text>
            <SegmentedControl
              options={[
                { label: 'Weekly recurring', value: 'recurring' },
                { label: 'Specific date', value: 'exception' },
              ]}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            />

            {/* Days of week (recurring) — multi-select */}
            {form.type === 'recurring' && (
              <View className="mt-4">
                <Text className="text-muted text-xs mb-1.5">
                  Days of week{!editingId ? ' (select multiple)' : ''}
                </Text>
                <View className="flex-row gap-1.5">
                  {DAY_NAMES.map((name, i) => {
                    const selected = form.days_of_week.includes(i)
                    return (
                      <Pressable
                        key={i}
                        onPress={() =>
                          setForm((f) => ({
                            ...f,
                            days_of_week: selected
                              ? f.days_of_week.filter((d) => d !== i)
                              : [...f.days_of_week, i].sort(),
                          }))
                        }
                        className="flex-1 py-2 items-center rounded-xl"
                        style={{
                          backgroundColor: selected
                            ? COLORS.gold
                            : COLORS.surfaceElevated,
                        }}
                      >
                        <Text
                          style={{
                            color: selected ? '#000' : COLORS.muted,
                            fontWeight: selected ? '700' : '500',
                            fontSize: 12,
                          }}
                        >
                          {name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                {form.days_of_week.length > 1 && !editingId && (
                  <Text className="text-muted text-xs mt-1.5">
                    {form.days_of_week.length} days selected — one entry per day will be created
                  </Text>
                )}
              </View>
            )}

            {/* Specific date (exception) */}
            {form.type === 'exception' && (
              <View className="mt-4">
                <Text className="text-muted text-xs mb-1.5">Date (YYYY-MM-DD)</Text>
                <TextInput
                  className="bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-white text-sm"
                  value={form.specific_date}
                  onChangeText={(v) => setForm((f) => ({ ...f, specific_date: v }))}
                  placeholder="2025-03-15"
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            )}

            {/* Time range */}
            <View className="flex-row gap-3 mt-4">
              <TimeInput
                label="Start time (HH:MM)"
                value={form.start_time}
                onChange={(v) => setForm((f) => ({ ...f, start_time: v }))}
              />
              <TimeInput
                label="End time (HH:MM)"
                value={form.end_time}
                onChange={(v) => setForm((f) => ({ ...f, end_time: v }))}
              />
            </View>

            {/* Mode preference */}
            <View className="mt-4">
              <Text className="text-muted text-xs mb-1.5">Mode preference</Text>
              <SegmentedControl
                options={MODE_OPTIONS}
                value={form.mode_preference}
                onChange={(v) => setForm((f) => ({ ...f, mode_preference: v }))}
              />
            </View>

            {/* Status */}
            <View className="mt-4">
              <Text className="text-muted text-xs mb-1.5">Status</Text>
              <SegmentedControl
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              />
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="mt-6 rounded-2xl py-3.5 items-center"
              style={{ backgroundColor: isSaving ? COLORS.goldDark : COLORS.gold }}
            >
              <Text style={{ color: '#000', fontWeight: '700', fontSize: 15 }}>
                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
