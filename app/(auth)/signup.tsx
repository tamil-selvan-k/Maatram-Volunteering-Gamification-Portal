import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react-native'
import { signupSchema, type SignupFormValues } from '@/schemas/auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { COLORS } from '@/constants/theme'

const ROLE_OPTIONS: { label: string; value: SignupFormValues['role'] }[] = [
  { label: 'Student', value: 'student' },
  { label: 'Alumni', value: 'alumni' },
  { label: 'Supporter', value: 'supporter' },
]

// ─── Verify-email screen ──────────────────────────────────────────────────────

function VerifyEmailScreen({
  email,
  onBackToLogin,
}: {
  email: string
  onBackToLogin: () => void
}) {
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleResend() {
    setResendState('sending')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendState(error ? 'error' : 'sent')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${COLORS.gold}18`,
              borderWidth: 1,
              borderColor: `${COLORS.gold}40`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mail size={36} color={COLORS.gold} />
          </View>
        </View>

        {/* Heading */}
        <Text
          style={{ color: COLORS.white, fontWeight: '700', fontSize: 24, textAlign: 'center', marginBottom: 8 }}
        >
          Check your inbox
        </Text>
        <Text
          style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 6 }}
        >
          We sent a verification link to
        </Text>
        <Text
          style={{ color: COLORS.white, fontWeight: '600', fontSize: 15, textAlign: 'center', marginBottom: 24 }}
        >
          {email}
        </Text>
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 36,
            paddingHorizontal: 8,
          }}
        >
          Click the link in the email to activate your account. The link expires in 24 hours.
          {'\n\n'}
          If you don't see it, check your spam folder.
        </Text>

        {/* Resend */}
        {resendState === 'sent' ? (
          <View
            style={{
              backgroundColor: '#14532d',
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#86efac', fontSize: 14 }}>Verification email resent!</Text>
          </View>
        ) : resendState === 'error' ? (
          <View
            style={{
              backgroundColor: '#7f1d1d',
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fca5a5', fontSize: 14 }}>
              Could not resend. Please try again in a moment.
            </Text>
          </View>
        ) : null}

        <Button
          title={resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
          variant="secondary"
          loading={resendState === 'sending'}
          icon={<RefreshCw size={15} color={COLORS.white} />}
          onPress={handleResend}
          className="mb-4"
        />

        <Pressable
          onPress={onBackToLogin}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}
        >
          <ArrowLeft size={14} color={COLORS.gold} />
          <Text style={{ color: COLORS.gold, fontSize: 14, fontWeight: '600' }}>Back to Sign In</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Signup screen ────────────────────────────────────────────────────────────

export default function SignupScreen() {
  const router = useRouter()
  const [signupError, setSignupError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

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
      const { data, error } = await supabase.auth.signUp({
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
      // session is null when Supabase requires email confirmation
      if (data.session === null) {
        setPendingEmail(values.email)
        return
      }
      // Email confirmation disabled — session is live, go straight to onboarding
      router.replace('/(auth)/onboarding')
    } catch {
      setSignupError('Network error. Please try again.')
    }
  }

  if (pendingEmail) {
    return (
      <VerifyEmailScreen
        email={pendingEmail}
        onBackToLogin={() => router.replace('/(auth)/login')}
      />
    )
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
