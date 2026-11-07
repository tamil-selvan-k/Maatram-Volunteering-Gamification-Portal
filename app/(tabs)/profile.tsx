import { View, Text, ScrollView, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { LevelBadge } from '@/components/gamification/LevelBadge'
import { StreakFlame } from '@/components/gamification/StreakFlame'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { updateVolunteerProfile } from '@/services/volunteer.service'
import { getInitials } from '@/utils'
import { COLORS } from '@/constants/theme'
import { ACTIVITY_LABELS } from '@/constants/activities'
import { useState, useCallback } from 'react'
import type { ActivityType } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = [
  'physical_event',
  'physical_verification',
  'school_visit',
  'office_bg_work',
  'telephone_verification',
  'other_small_work',
]

export default function ProfileScreen() {
  const volunteer = useAuthStore(selectVolunteer)
  const setVolunteer = useAuthStore((s) => s.setVolunteer)
  const [saving, setSaving] = useState(false)
  const [consentPush, setConsentPush] = useState(volunteer?.consent_push ?? true)
  const [consentEmail, setConsentEmail] = useState(volunteer?.consent_email ?? true)
  const [consentLinkedin, setConsentLinkedin] = useState(volunteer?.consent_linkedin ?? false)
  const [prefs, setPrefs] = useState<ActivityType[]>(volunteer?.preferences ?? [])

  const togglePref = useCallback((type: ActivityType) => {
    setPrefs((prev) =>
      prev.includes(type) ? prev.filter((p) => p !== type) : [...prev, type]
    )
  }, [])

  const handleSave = useCallback(async () => {
    if (!volunteer) return
    setSaving(true)
    const result = await updateVolunteerProfile(volunteer.id, {
      preferences: prefs,
      consent_push: consentPush,
      consent_email: consentEmail,
      consent_linkedin: consentLinkedin,
    })
    setSaving(false)
    if (result.error) {
      Alert.alert('Error', result.error.message)
    } else {
      setVolunteer(result.data)
      Alert.alert('Saved', 'Your profile has been updated.')
    }
  }, [volunteer, prefs, consentPush, consentEmail, consentLinkedin, setVolunteer])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  if (!volunteer) return null

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View className="items-center mb-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: COLORS.surfaceElevated, borderWidth: 2, borderColor: COLORS.gold }}
          >
            <Text className="text-white font-bold text-2xl">{getInitials(volunteer.full_name)}</Text>
          </View>
          <Text className="text-white font-bold text-xl">{volunteer.full_name}</Text>
          <Text className="text-muted text-sm mb-2">{volunteer.email}</Text>
          <View className="flex-row gap-2">
            <LevelBadge points={volunteer.total_points} />
            <StreakFlame months={volunteer.streak_months} showLabel />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          {[
            { label: 'Points',   value: volunteer.total_points.toLocaleString() },
            { label: 'Events',   value: String(volunteer.times_completed) },
          ].map((s) => (
            <View key={s.label} className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
              <Text className="text-gold font-bold text-xl">{s.value}</Text>
              <Text className="text-muted text-xs mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Activity preferences */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Preferred activities</Text>
          <View className="flex-row flex-wrap gap-2">
            {ACTIVITY_TYPES.map((type) => {
              const selected = prefs.includes(type)
              return (
                <View
                  key={type}
                  onTouchEnd={() => togglePref(type)}
                  className={`rounded-full border px-3 py-1.5 ${
                    selected ? 'bg-gold/15 border-gold/50' : 'bg-surface-elevated border-border'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${selected ? 'text-gold' : 'text-muted'}`}>
                    {ACTIVITY_LABELS[type]}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Consent toggles */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4 gap-3">
          <Text className="text-white font-semibold">Communication</Text>
          {[
            { label: 'Push notifications',   value: consentPush,     setter: setConsentPush },
            { label: 'Email updates',         value: consentEmail,    setter: setConsentEmail },
            { label: 'LinkedIn certificate',  value: consentLinkedin, setter: setConsentLinkedin },
          ].map((item) => (
            <View key={item.label} className="flex-row items-center justify-between">
              <Text className="text-muted text-sm">{item.label}</Text>
              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{ false: '#2A2A30', true: '#F5B800' }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        <Button
          title="Save Changes"
          loading={saving}
          onPress={handleSave}
          className="mb-3"
        />
        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
