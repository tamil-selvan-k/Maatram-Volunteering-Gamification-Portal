import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/theme'
import { ACTIVITY_LABELS } from '@/constants/activities'
import { useCreateOpportunity, useActivityTypes } from '@/hooks/useAdmin'
import { showAlert } from '@/lib/alert'
import type { ActivityType } from '@/types'

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  title: string
  description: string
  activity_type: string
  mode: 'online' | 'offline'
  location: string
  event_date: string           // YYYY-MM-DDTHH:MM
  duration_hours: string
  total_slots: string
  registration_deadline: string // YYYY-MM-DDTHH:MM
  required_skills: string      // comma-separated
  mandatory_skills: string     // comma-separated
}

const DEFAULT_FORM: FormState = {
  title: '',
  description: '',
  activity_type: 'school_visit',
  mode: 'offline',
  location: '',
  event_date: '',
  duration_hours: '',
  total_slots: '',
  registration_deadline: '',
  required_skills: '',
  mandatory_skills: '',
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const LABEL = {
  color: COLORS.muted,
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 0.6,
  marginBottom: 6,
  marginTop: 18,
}

const INPUT = {
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: COLORS.white,
  fontSize: 14,
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewOpportunityScreen() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const { mutate: createOpp, isPending } = useCreateOpportunity()
  const { data: dynamicTypes } = useActivityTypes()

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showAlert('Required', 'Title is required.')
      return
    }
    if (!form.event_date) {
      showAlert('Required', 'Event date is required.')
      return
    }
    const eventMs = new Date(form.event_date).getTime()
    if (isNaN(eventMs)) {
      showAlert('Invalid Date', 'Event date format: YYYY-MM-DDTHH:MM (e.g. 2024-02-15T10:00)')
      return
    }
    const hours = parseFloat(form.duration_hours)
    if (isNaN(hours) || hours <= 0) {
      showAlert('Required', 'Duration must be a positive number.')
      return
    }
    const slots = parseInt(form.total_slots, 10)
    if (isNaN(slots) || slots <= 0) {
      showAlert('Required', 'Total slots must be a positive integer.')
      return
    }
    if (!form.registration_deadline) {
      showAlert('Required', 'Registration deadline is required.')
      return
    }
    const deadlineMs = new Date(form.registration_deadline).getTime()
    if (isNaN(deadlineMs)) {
      showAlert('Invalid Date', 'Deadline format: YYYY-MM-DDTHH:MM (e.g. 2024-02-10T23:59)')
      return
    }

    createOpp(
      {
        title: form.title.trim(),
        description: form.description.trim() || null,
        activity_type: form.activity_type as ActivityType,
        mode: form.mode,
        location: form.location.trim() || null,
        event_date: new Date(form.event_date).toISOString(),
        duration_hours: hours,
        total_slots: slots,
        registration_deadline: new Date(form.registration_deadline).toISOString(),
        required_skills: form.required_skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        mandatory_skills: form.mandatory_skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          router.back()
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to create opportunity.'
          showAlert('Error', msg)
        },
      }
    )
  }

  // Use DB-driven types; fall back to hardcoded if table not yet seeded
  const activityTypes: Array<{ key: string; label: string }> =
    dynamicTypes && dynamicTypes.length > 0
      ? dynamicTypes.map((t) => ({ key: t.key, label: t.label }))
      : (Object.entries(ACTIVITY_LABELS) as [ActivityType, string][]).map(([key, label]) => ({
          key,
          label,
        }))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
            Post Opportunity
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 56 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Title ── */}
          <Text style={LABEL}>TITLE *</Text>
          <TextInput
            style={INPUT}
            value={form.title}
            onChangeText={(v) => set('title', v)}
            placeholder="e.g. School Visit – Delhi North"
            placeholderTextColor={COLORS.muted}
          />

          {/* ── Description ── */}
          <Text style={LABEL}>DESCRIPTION</Text>
          <TextInput
            style={[INPUT, { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder="Describe the opportunity, what volunteers will do..."
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={3}
          />

          {/* ── Activity Type ── */}
          <Text style={LABEL}>ACTIVITY TYPE *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {activityTypes.map(({ key, label }) => {
              const selected = form.activity_type === key
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => set('activity_type', key)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    backgroundColor: selected ? `${COLORS.gold}20` : COLORS.surface,
                    borderColor: selected ? COLORS.gold : COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? COLORS.gold : COLORS.muted,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* ── Mode ── */}
          <Text style={LABEL}>MODE *</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['offline', 'online'] as const).map((m) => {
              const selected = form.mode === m
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => set('mode', m)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    backgroundColor: selected ? `${COLORS.gold}20` : COLORS.surface,
                    borderColor: selected ? COLORS.gold : COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? COLORS.gold : COLORS.muted,
                      fontWeight: '600',
                      fontSize: 14,
                      textTransform: 'capitalize',
                    }}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* ── Location ── */}
          <Text style={LABEL}>
            LOCATION{form.mode === 'online' ? ' (optional for online events)' : ''}
          </Text>
          <TextInput
            style={INPUT}
            value={form.location}
            onChangeText={(v) => set('location', v)}
            placeholder="e.g. Community Hall, Sector 12, Delhi"
            placeholderTextColor={COLORS.muted}
          />

          {/* ── Event Date ── */}
          <Text style={LABEL}>EVENT DATE & TIME * (YYYY-MM-DDTHH:MM)</Text>
          <TextInput
            style={INPUT}
            value={form.event_date}
            onChangeText={(v) => set('event_date', v)}
            placeholder="e.g. 2024-02-15T10:00"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ── Duration ── */}
          <Text style={LABEL}>DURATION (HOURS) *</Text>
          <TextInput
            style={INPUT}
            value={form.duration_hours}
            onChangeText={(v) => set('duration_hours', v)}
            placeholder="e.g. 3"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
          />

          {/* ── Registration Deadline ── */}
          <Text style={LABEL}>REGISTRATION DEADLINE * (YYYY-MM-DDTHH:MM)</Text>
          <TextInput
            style={INPUT}
            value={form.registration_deadline}
            onChangeText={(v) => set('registration_deadline', v)}
            placeholder="e.g. 2024-02-10T23:59"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ── Total Slots ── */}
          <Text style={LABEL}>TOTAL SLOTS *</Text>
          <TextInput
            style={INPUT}
            value={form.total_slots}
            onChangeText={(v) => set('total_slots', v)}
            placeholder="e.g. 15"
            placeholderTextColor={COLORS.muted}
            keyboardType="number-pad"
          />

          {/* ── Required Skills ── */}
          <Text style={LABEL}>REQUIRED SKILLS (comma-separated)</Text>
          <TextInput
            style={INPUT}
            value={form.required_skills}
            onChangeText={(v) => set('required_skills', v)}
            placeholder="e.g. Communication, Empathy"
            placeholderTextColor={COLORS.muted}
          />

          {/* ── Mandatory Skills ── */}
          <Text style={LABEL}>MANDATORY SKILLS (comma-separated)</Text>
          <TextInput
            style={INPUT}
            value={form.mandatory_skills}
            onChangeText={(v) => set('mandatory_skills', v)}
            placeholder="e.g. Driving License"
            placeholderTextColor={COLORS.muted}
          />

          {/* ── Submit ── */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.8}
            style={{
              marginTop: 28,
              padding: 16,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: isPending ? `${COLORS.gold}60` : COLORS.gold,
            }}
          >
            {isPending ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={{ color: COLORS.bg, fontWeight: '800', fontSize: 15 }}>
                Post Opportunity
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
