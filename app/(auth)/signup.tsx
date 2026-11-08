import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signupSchema, type SignupFormValues } from '@/schemas/auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

const ROLE_OPTIONS: { label: string; value: SignupFormValues['role'] }[] = [
  { label: 'Student', value: 'student' },
  { label: 'Alumni', value: 'alumni' },
  { label: 'Supporter', value: 'supporter' },
]

export default function SignupScreen() {
  const router = useRouter()
  const [signupError, setSignupError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: 'student',
      employer_org: '',
    },
  })

  const selectedRole = watch('role')

  async function onSubmit(values: SignupFormValues) {
    setSignupError(null)
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            phone: values.phone ?? null,
            role: values.role,
            employer_org: values.employer_org ?? null,
          },
        },
      })
      if (error) {
        setSignupError(error.message)
        return
      }
      router.replace('/(auth)/onboarding')
    } catch (e) {
      setSignupError('Network error. Please try again.')
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
          <Text className="text-white font-bold text-2xl mb-1">Create Account</Text>
          <Text className="text-muted text-sm">Join Maatram's volunteer community</Text>
        </View>

        {signupError && (
          <View style={{ backgroundColor: '#7f1d1d', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#fca5a5', fontSize: 14 }}>{signupError}</Text>
          </View>
        )}

        <View className="gap-4">
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Full Name"
                placeholder="Your full name"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.full_name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Password"
                placeholder="Min 8 characters"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Phone (optional)"
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
              />
            )}
          />

          {/* Role selector */}
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-white">Role</Text>
            <View className="flex-row gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  className={`flex-1 py-3 rounded-xl border items-center ${
                    selectedRole === opt.value
                      ? 'bg-gold/15 border-gold/50'
                      : 'bg-surface border-border'
                  }`}
                  onPress={() => setValue('role', opt.value)}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedRole === opt.value ? 'text-gold' : 'text-muted'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {selectedRole !== 'student' && (
            <Controller
              control={control}
              name="employer_org"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Organisation (optional)"
                  placeholder="Your employer or institution"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.employer_org?.message}
                />
              )}
            />
          )}

          <Button
            title="Create Account"
            size="lg"
            loading={isSubmitting}
            onPress={() => { void handleSubmit(onSubmit)() }}
            className="mt-2"
          />
        </View>

        <View className="flex-row justify-center mt-6 mb-8">
          <Text className="text-muted text-sm">Already have an account? </Text>
          <Text
            className="text-gold text-sm font-semibold"
            onPress={() => router.back()}
          >
            Sign In
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
