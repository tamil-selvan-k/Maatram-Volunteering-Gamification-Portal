import { View, Text, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SafeAreaView } from 'react-native-safe-area-context'
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schema'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'

export default function LoginScreen() {
  const router = useRouter()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      Alert.alert('Login Failed', error.message)
      return
    }
    router.replace('/(tabs)/')
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text className="text-gold font-bold text-3xl mb-1">Maatram</Text>
          <Text className="text-white font-bold text-xl">Welcome back</Text>
          <Text className="text-muted text-sm mt-1">Sign in to continue volunteering</Text>
        </View>

        <View className="gap-4">
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
                placeholder="••••••••"
                secureTextEntry
                autoComplete="current-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Button
            title="Sign In"
            size="lg"
            loading={isSubmitting}
            onPress={() => { void handleSubmit(onSubmit)() }}
            className="mt-2"
          />
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-muted text-sm">Don't have an account? </Text>
          <Text
            className="text-gold text-sm font-semibold"
            onPress={() => router.push('/(auth)/signup')}
          >
            Sign Up
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
