import { View, Text, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore, selectIsAdmin } from '@/stores/auth.store'
import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { ActivityType } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = [
  'physical_event',
  'physical_verification',
  'school_visit',
  'office_bg_work',
  'telephone_verification',
  'other_small_work',
]

const createOpportunitySchema = z.object({
  title:                 z.string().min(5, 'Title must be at least 5 characters').max(200),
  description:           z.string().max(1000).optional(),
  activity_type:         z.enum(['physical_event', 'physical_verification', 'school_visit', 'office_bg_work', 'telephone_verification', 'other_small_work']),
  mode:                  z.enum(['online', 'offline']),
  location:              z.string().max(200).optional(),
  event_date:            z.string().min(1, 'Event date required'),
  duration_hours:        z.coerce.number().min(0.5).max(24),
  total_slots:           z.coerce.number().min(1).max(200),
  registration_deadline: z.string().min(1, 'Registration deadline required'),
})

type CreateOpportunityValues = z.infer<typeof createOpportunitySchema>

export default function AdminScreen() {
  const isAdmin = useAuthStore(selectIsAdmin)
  const volunteer = useAuthStore((s) => s.volunteer)
  const router = useRouter()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOpportunityValues>({
    resolver: zodResolver(createOpportunitySchema) as Resolver<CreateOpportunityValues>,
    defaultValues: {
      title: '',
      description: '',
      activity_type: 'physical_event',
      mode: 'offline',
      location: '',
      event_date: '',
      duration_hours: 2,
      total_slots: 10,
      registration_deadline: '',
    },
  })

  const selectedMode = watch('mode')
  const selectedType = watch('activity_type')

  async function onSubmit(values: CreateOpportunityValues) {
    if (!volunteer) return
    try {
      const { error } = await supabase.from('opportunities').insert({
        title:                 values.title,
        description:           values.description ?? null,
        activity_type:         values.activity_type,
        mode:                  values.mode,
        location:              values.location ?? null,
        location_lat:          null,
        location_lng:          null,
        event_date:            new Date(values.event_date).toISOString(),
        duration_hours:        values.duration_hours,
        total_slots:           values.total_slots,
        registration_deadline: new Date(values.registration_deadline).toISOString(),
        required_skills:       [],
        mandatory_skills:      [],
        status:                'open',
        created_by:            volunteer.id,
      })

      if (error) {
        const appErr = toAppError(error)
        Alert.alert('Error', appErr.message)
        return
      }

      Alert.alert('Created!', 'Opportunity published successfully.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/opportunities') },
      ])
    } catch (err) {
      const appErr = toAppError(err)
      Alert.alert('Error', appErr.message)
    }
  }

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-muted text-base">Admin access required</Text>
        <Button title="Go Back" variant="ghost" onPress={() => router.back()} className="mt-4" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white font-bold text-xl">Create Opportunity</Text>
          <Button title="Back" variant="ghost" size="sm" onPress={() => router.back()} />
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Title"
                placeholder="Mock Interview Drive"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Description (optional)"
                placeholder="Describe the activity..."
                multiline
                numberOfLines={3}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
              />
            )}
          />

          {/* Activity type */}
          <View>
            <Text className="text-sm font-semibold text-white mb-1.5">Activity Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <View
                  key={type}
                  onTouchEnd={() => setValue('activity_type', type)}
                  className={`px-3 py-1.5 rounded-full border ${
                    selectedType === type ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
                  }`}
                >
                  <Text className={`text-xs font-semibold ${selectedType === type ? 'text-gold' : 'text-muted'}`}>
                    {type.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Mode */}
          <View>
            <Text className="text-sm font-semibold text-white mb-1.5">Mode</Text>
            <View className="flex-row gap-2">
              {(['online', 'offline'] as const).map((m) => (
                <View
                  key={m}
                  onTouchEnd={() => setValue('mode', m)}
                  className={`flex-1 py-3 rounded-xl border items-center ${
                    selectedMode === m ? 'bg-gold/15 border-gold/50' : 'bg-surface border-border'
                  }`}
                >
                  <Text className={`text-sm font-semibold capitalize ${selectedMode === m ? 'text-gold' : 'text-muted'}`}>
                    {m}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {selectedMode === 'offline' && (
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Location"
                  placeholder="Venue name, area"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.location?.message}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="event_date"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Event Date (YYYY-MM-DD HH:MM)"
                placeholder="2026-12-25 09:00"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.event_date?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="registration_deadline"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Registration Deadline (YYYY-MM-DD)"
                placeholder="2026-12-20"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.registration_deadline?.message}
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="duration_hours"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Duration (hours)"
                    placeholder="2"
                    keyboardType="numeric"
                    value={String(value)}
                    onChangeText={(v) => onChange(parseFloat(v) || 0)}
                    onBlur={onBlur}
                    error={errors.duration_hours?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="total_slots"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Total Slots"
                    placeholder="10"
                    keyboardType="numeric"
                    value={String(value)}
                    onChangeText={(v) => onChange(parseInt(v, 10) || 0)}
                    onBlur={onBlur}
                    error={errors.total_slots?.message}
                  />
                )}
              />
            </View>
          </View>

          <Button
            title="Publish Opportunity"
            size="lg"
            loading={isSubmitting}
            onPress={() => { void handleSubmit(onSubmit)() }}
            className="mt-2"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
