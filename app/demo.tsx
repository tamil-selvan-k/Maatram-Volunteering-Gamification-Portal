import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useOpportunities } from '@/hooks/useOpportunities'
import { COLORS } from '@/constants/theme'

interface DemoStep {
  title: string
  description: string
  action: () => void
}

export default function DemoScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const { data: opportunities } = useOpportunities()

  const firstOpenOpportunityId =
    opportunities?.find((o) => o.status === 'open')?.id ?? 'placeholder'

  const steps: DemoStep[] = [
    {
      title: 'Sign up as a volunteer',
      description:
        'Create your account with name, email, and preferred role. Takes less than 60 seconds.',
      action: () => router.push('/(auth)/signup'),
    },
    {
      title: 'Browse opportunities',
      description:
        'See upcoming volunteering events near you. Filter by activity type and register for free.',
      action: () => router.push('/(tabs)'),
    },
    {
      title: 'Check in with QR code',
      description:
        'At the event, scan the organiser QR code or display yours to get verified. Photo proof optional.',
      action: () => router.push(`/event/${firstOpenOpportunityId}` as never),
    },
    {
      title: 'See your impact',
      description:
        'Watch your points grow, track your activity heatmap, and unlock badges on your personal dashboard.',
      action: () => router.push('/(tabs)/dashboard'),
    },
    {
      title: 'Check the leaderboard',
      description:
        'Compete with peers — filter by month, quarter, or all time. Top 3 get a podium spotlight.',
      action: () => router.push('/(tabs)/leaderboard'),
    },
    {
      title: 'Explore your profile',
      description:
        'Update skills, share your impact certificate to LinkedIn, and manage notification preferences.',
      action: () => router.push('/(tabs)/profile'),
    },
  ]

  const totalSteps = steps.length
  const step = steps[currentStep]!
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  const handleGo = () => {
    step.action()
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{ color: COLORS.gold, fontWeight: '800', fontSize: 26, marginBottom: 4 }}
          >
            Maatram Demo
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 14 }}>
            A guided walkthrough for evaluators — 6 steps
          </Text>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: COLORS.surfaceElevated,
            marginBottom: 6,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: COLORS.gold,
              borderRadius: 3,
            }}
          />
        </View>
        <Text
          style={{ color: COLORS.muted, fontSize: 12, marginBottom: 28, textAlign: 'right' }}
        >
          Step {currentStep + 1} of {totalSteps}
        </Text>

        {/* Step card */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
          }}
        >
          {/* Step badge */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: `${COLORS.gold}20`,
              borderWidth: 2,
              borderColor: COLORS.gold,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{ color: COLORS.gold, fontWeight: '800', fontSize: 16 }}
            >
              {currentStep + 1}
            </Text>
          </View>

          <Text
            style={{
              color: COLORS.white,
              fontWeight: '700',
              fontSize: 20,
              marginBottom: 10,
            }}
          >
            {step.title}
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            {step.description}
          </Text>

          {/* Go button */}
          <TouchableOpacity
            onPress={handleGo}
            activeOpacity={0.8}
            style={{
              backgroundColor: COLORS.gold,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text
              style={{ color: COLORS.bg, fontWeight: '800', fontSize: 16 }}
            >
              Go →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 28,
          }}
        >
          {steps.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCurrentStep(i)}
              activeOpacity={0.7}
              style={{
                width: i === currentStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === currentStep ? COLORS.gold : COLORS.surfaceElevated,
              }}
            />
          ))}
        </View>

        {/* Prev / Next navigation */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={handlePrev}
            activeOpacity={0.7}
            disabled={currentStep === 0}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: currentStep === 0 ? COLORS.border : COLORS.gold,
              alignItems: 'center',
              backgroundColor: COLORS.surface,
              opacity: currentStep === 0 ? 0.4 : 1,
            }}
          >
            <Text
              style={{
                color: currentStep === 0 ? COLORS.muted : COLORS.gold,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.7}
            disabled={currentStep === totalSteps - 1}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor:
                currentStep === totalSteps - 1 ? COLORS.border : COLORS.gold,
              alignItems: 'center',
              backgroundColor: COLORS.surface,
              opacity: currentStep === totalSteps - 1 ? 0.4 : 1,
            }}
          >
            <Text
              style={{
                color:
                  currentStep === totalSteps - 1 ? COLORS.muted : COLORS.gold,
                fontWeight: '600',
                fontSize: 14,
              }}
            >
              Next Step
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back link */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            Exit demo
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
