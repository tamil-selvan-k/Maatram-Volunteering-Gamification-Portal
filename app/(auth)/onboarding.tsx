import { View, Text, ScrollView, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { onboardingSchema, type OnboardingFormValues } from '@/schemas/auth.schema'
import { Button } from '@/components/ui/Button'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { ACTIVITY_LABELS } from '@/constants/activities'
import { supabase } from '@/lib/supabase/client'
import { updateVolunteerProfile } from '@/services/volunteer.service'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { showAlert } from '@/lib/alert'
import type { ActivityType } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = [
  'physical_event',
  'physical_verification',
  'school_visit',
  'office_bg_work',
  'telephone_verification',
  'other_small_work',
]

export default function OnboardingScreen() {
  const router = useRouter()
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      preferences: [],
      skills: '',
      consent_push: true,
      consent_email: true,
      consent_linkedin: false,
    },
  })

  const preferences = watch('preferences')

  function togglePreference(type: ActivityType) {
    const current = preferences ?? []
    if (current.includes(type)) {
      setValue('preferences', current.filter((p) => p !== type))
    } else {
      setValue('preferences', [...current, type])
    }
  }

  async function onSubmit(values: OnboardingFormValues) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showAlert('Error', 'Session expired. Please log in again.')
      router.replace('/(auth)/login')
      return
    }

    const skillsArray = values.skills
      ? values.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const result = await updateVolunteerProfile(user.id, {
      preferences: values.preferences,
      skills: skillsArray,
      consent_push: values.consent_push,
      consent_email: values.consent_email,
      consent_linkedin: values.consent_linkedin,
    })

    if (result.error) {
      showAlert('Error', result.error.message)
      return
    }

    if (result.data) {
      useAuthStore.getState().setVolunteer(result.data)
      useUIStore.getState().setNeedsOnboarding(false)
      router.replace('/(tabs)')
    } else {
      showAlert('Error', 'Something went wrong saving your profile. Please try again.')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8 mt-4">
          <Text className="text-white font-bold text-2xl mb-1">Let's personalise your experience</Text>
          <Text className="text-muted text-sm">Tell us what you enjoy volunteering for</Text>
        </View>

        {/* Activity preferences */}
        <View className="mb-6">
          <Text className="text-white font-semibold text-base mb-3">
            Preferred activities <Text className="text-red-400">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ACTIVITY_TYPES.map((type) => {
              const selected = preferences?.includes(type)
              return (
                <View
                  key={type}
                  onTouchEnd={() => togglePreference(type)}
                  className={`rounded-full border px-3 py-2 ${
                    selected ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${selected ? 'text-gold' : 'text-muted'}`}>
                    {ACTIVITY_LABELS[type]}
                  </Text>
                </View>
              )
            })}
          </View>
          {errors.preferences && (
            <Text className="text-red-400 text-xs mt-1">{errors.preferences.message}</Text>
          )}
        </View>

        {/* Consent toggles */}
        <View className="gap-3 mb-6">
          <Text className="text-white font-semibold text-base mb-1">Communication preferences</Text>

          {(['consent_push', 'consent_email', 'consent_linkedin'] as const).map((key) => {
            const labels: Record<typeof key, { title: string; sub: string }> = {
              consent_push:     { title: 'Push notifications',  sub: 'New opportunities and event reminders' },
              consent_email:    { title: 'Email updates',       sub: 'Monthly summaries and important news' },
              consent_linkedin: { title: 'LinkedIn certificate',sub: 'Share verified hours on LinkedIn' },
            }
            return (
              <View key={key} className="flex-row items-center justify-between bg-surface rounded-xl p-4 border border-border">
                <View className="flex-1 mr-4">
                  <Text className="text-white font-semibold text-sm">{labels[key].title}</Text>
                  <Text className="text-muted text-xs mt-0.5">{labels[key].sub}</Text>
                </View>
                <Controller
                  control={control}
                  name={key}
                  render={({ field: { value, onChange } }) => (
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: '#2A2A30', true: '#F5B800' }}
                      thumbColor="#FFFFFF"
                    />
                  )}
                />
              </View>
            )
          })}
        </View>

        <Button
          title="Get Started"
          size="lg"
          loading={isSubmitting}
          onPress={() => { void handleSubmit(onSubmit)() }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
