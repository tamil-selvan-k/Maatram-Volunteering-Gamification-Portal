import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, Pressable } from 'react-native'
import { showAlert } from '@/lib/alert'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'expo-router'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { LevelBadge } from '@/components/gamification/LevelBadge'
import { StreakFlame } from '@/components/gamification/StreakFlame'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ImpactSummary } from '@/components/profile/ImpactSummary'
import { supabase } from '@/lib/supabase/client'
import { updateVolunteerProfile } from '@/services/volunteer.service'
import { canShareToLinkedIn, shareToLinkedIn } from '@/lib/linkedin'
import { getInitials } from '@/utils'
import { COLORS } from '@/constants/theme'
import { ACTIVITY_LABELS } from '@/constants/activities'
import type { ActivityType } from '@/types'

// ─── Schema ───────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  full_name:        z.string().min(2, 'Name must be at least 2 characters').max(100),
  employer_org:     z.string().max(100).optional().or(z.literal('')),
  skills:           z.array(z.string()),
  preferences:      z.array(
    z.enum([
      'physical_event', 'physical_verification', 'school_visit',
      'office_bg_work', 'telephone_verification', 'other_small_work',
    ])
  ),
  consent_push:     z.boolean(),
  consent_email:    z.boolean(),
  consent_linkedin: z.boolean(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTIVITY_TYPES: ActivityType[] = [
  'physical_event',
  'physical_verification',
  'school_visit',
  'office_bg_work',
  'telephone_verification',
  'other_small_work',
]

const SKILL_OPTIONS: string[] = [
  'Teaching',
  'Mentoring',
  'Healthcare',
  'Construction',
  'IT/Tech',
  'Cooking',
  'Transport',
  'Event Management',
  'Fundraising',
  'Translation',
  'Photography',
  'Music/Arts',
  'Sports Coaching',
  'Legal Aid',
  'Counselling',
]

// ─── Chip component ───────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 8,
        marginRight: 8,
        borderColor: selected ? COLORS.gold : COLORS.border,
        backgroundColor: selected ? `${COLORS.gold}20` : COLORS.surfaceElevated,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: selected ? COLORS.gold : COLORS.muted,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Impact summary shimmer */}
        <Skeleton height={130} className="rounded-2xl mb-5" />

        {/* Avatar + name shimmer */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.surfaceElevated,
              marginBottom: 12,
            }}
          />
          <View style={{ width: 160, marginBottom: 8 }}>
            <Skeleton height={18} className="rounded-lg" />
          </View>
          <View style={{ width: 120, marginBottom: 10 }}>
            <Skeleton height={14} className="rounded-md" />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 80 }}>
              <Skeleton height={28} className="rounded-full" />
            </View>
            <View style={{ width: 100 }}>
              <Skeleton height={28} className="rounded-full" />
            </View>
          </View>
        </View>

        {/* Stats shimmer */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Skeleton height={80} className="rounded-2xl" />
          </View>
          <View style={{ flex: 1 }}>
            <Skeleton height={80} className="rounded-2xl" />
          </View>
        </View>

        {/* Form section shimmers */}
        {[100, 100, 190, 220, 180].map((h, i) => (
          <Skeleton key={i} height={h} className="rounded-2xl mb-3" />
        ))}

        {/* Button shimmers */}
        <Skeleton height={52} className="rounded-2xl mb-3" />
        <Skeleton height={52} className="rounded-2xl" />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const volunteer = useAuthStore(selectVolunteer)
  const isLoading = useAuthStore((s) => s.isLoading)
  const setVolunteer = useAuthStore((s) => s.setVolunteer)
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name:        volunteer?.full_name ?? '',
      employer_org:     volunteer?.employer_org ?? '',
      skills:           volunteer?.skills ?? [],
      preferences:      (volunteer?.preferences ?? []) as ProfileFormValues['preferences'],
      consent_push:     volunteer?.consent_push ?? true,
      consent_email:    volunteer?.consent_email ?? true,
      consent_linkedin: volunteer?.consent_linkedin ?? false,
    },
  })

  const onSubmit = async (values: ProfileFormValues) => {
    if (!volunteer) return
    const result = await updateVolunteerProfile(volunteer.id, {
      full_name: values.full_name,
      preferences: values.preferences,
      skills: values.skills,
      consent_push: values.consent_push,
      consent_email: values.consent_email,
      consent_linkedin: values.consent_linkedin,
      employer_org: values.employer_org || null,
    })
    if (result.error) {
      showAlert('Error', result.error.message)
    } else {
      setVolunteer(result.data)
      showAlert('Saved', 'Your profile has been updated.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (isLoading) return <ProfileSkeleton />

  // Volunteer row didn't load — show a dark fallback rather than a blank white screen
  if (!volunteer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 28 }}>👤</Text>
        </View>
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
          Profile unavailable
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          We couldn't load your profile data. Please sign out and sign back in.
        </Text>
        <Pressable
          onPress={handleSignOut}
          style={{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 15 }}>Sign Out</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Impact summary */}
        <ImpactSummary volunteerId={volunteer.id} totalPoints={volunteer.total_points} />

        {/* Avatar + level */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              backgroundColor: COLORS.surfaceElevated,
              borderWidth: 2,
              borderColor: COLORS.gold,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 24 }}>
              {getInitials(volunteer.full_name)}
            </Text>
          </View>
          <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 20, marginBottom: 2 }}>
            {volunteer.full_name}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 10 }}>
            {volunteer.email}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LevelBadge points={volunteer.total_points} />
            <StreakFlame months={volunteer.streak_months} showLabel />
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Points', value: volunteer.total_points.toLocaleString() },
            { label: 'Events', value: String(volunteer.times_completed) },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.gold, fontWeight: '700', fontSize: 20 }}>
                {s.value}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Full name */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600', marginBottom: 10 }}>
            Full Name
          </Text>
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Your full name"
                placeholderTextColor={COLORS.muted}
                style={{
                  color: COLORS.white,
                  backgroundColor: COLORS.surfaceElevated,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: errors.full_name ? COLORS.error : COLORS.border,
                }}
              />
            )}
          />
          {errors.full_name && (
            <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>
              {errors.full_name.message}
            </Text>
          )}
        </View>

        {/* Employer / org */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600', marginBottom: 10 }}>
            Employer / Organisation
          </Text>
          <Controller
            control={control}
            name="employer_org"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Optional"
                placeholderTextColor={COLORS.muted}
                style={{
                  color: COLORS.white,
                  backgroundColor: COLORS.surfaceElevated,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              />
            )}
          />
        </View>

        {/* Skills multi-select */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600', marginBottom: 12 }}>
            Skills
          </Text>
          <Controller
            control={control}
            name="skills"
            render={({ field: { onChange, value } }) => (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {SKILL_OPTIONS.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    selected={value.includes(skill)}
                    onPress={() => {
                      onChange(
                        value.includes(skill)
                          ? value.filter((s) => s !== skill)
                          : [...value, skill]
                      )
                    }}
                  />
                ))}
              </View>
            )}
          />
        </View>

        {/* Activity preferences */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600', marginBottom: 12 }}>
            Preferred activities
          </Text>
          {errors.preferences && (
            <Text style={{ color: COLORS.error, fontSize: 12, marginBottom: 8 }}>
              {errors.preferences.message}
            </Text>
          )}
          <Controller
            control={control}
            name="preferences"
            render={({ field: { onChange, value } }) => (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {ACTIVITY_TYPES.map((type) => (
                  <Chip
                    key={type}
                    label={ACTIVITY_LABELS[type]}
                    selected={value.includes(type)}
                    onPress={() => {
                      onChange(
                        value.includes(type)
                          ? value.filter((p) => p !== type)
                          : [...value, type]
                      )
                    }}
                  />
                ))}
              </View>
            )}
          />
        </View>

        {/* Consent toggles */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            gap: 12,
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: '600' }}>Communication</Text>
          {(
            [
              { name: 'consent_push',     label: 'Push notifications' },
              { name: 'consent_email',    label: 'Email updates' },
              { name: 'consent_linkedin', label: 'LinkedIn badge sharing' },
            ] as const
          ).map((item) => (
            <Controller
              key={item.name}
              control={control}
              name={item.name}
              render={({ field: { onChange, value } }) => (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: COLORS.muted, fontSize: 14 }}>{item.label}</Text>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: COLORS.border, true: COLORS.gold }}
                    thumbColor={COLORS.white}
                  />
                </View>
              )}
            />
          ))}
        </View>

        <Button
          title="Save Changes"
          loading={isSubmitting}
          onPress={() => { void handleSubmit(onSubmit)() }}
          className="mb-3"
        />

        {/* LinkedIn share button */}
        {canShareToLinkedIn(volunteer) && (
          <TouchableOpacity
            onPress={() => { void shareToLinkedIn(volunteer) }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: COLORS.gold,
              borderRadius: 14,
              paddingVertical: 14,
              marginBottom: 12,
              backgroundColor: `${COLORS.gold}08`,
            }}
          >
            <Text style={{ color: COLORS.gold, fontSize: 14, fontWeight: '700' }}>
              in  Share on LinkedIn
            </Text>
          </TouchableOpacity>
        )}

        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleSignOut}
        />

        {/* Demo Mode link — visible only in development */}
        {__DEV__ && (
          <TouchableOpacity
            onPress={() => router.push('/demo')}
            activeOpacity={0.7}
            style={{ marginTop: 20, alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 12, textDecorationLine: 'underline' }}>
              Demo Mode
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
