import { ScrollView, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { ProgressRing } from '@/components/gamification/ProgressRing'
import { StreakFlame } from '@/components/gamification/StreakFlame'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { COLORS } from '@/constants/theme'

// 12 weeks × 7 days heatmap
const WEEKS = 12
const DAYS  = 7

function HeatmapCell({ active }: { active: boolean }) {
  return (
    <View
      className="rounded-sm"
      style={{
        width: 14,
        height: 14,
        margin: 1,
        backgroundColor: active ? COLORS.gold : COLORS.surfaceElevated,
        opacity: active ? 0.9 : 0.5,
      }}
    />
  )
}

// Simple deterministic "fake" activity data for visual demo
function generateHeatmapData(): boolean[][] {
  return Array.from({ length: WEEKS }, (_, wi) =>
    Array.from({ length: DAYS }, (_, di) => (wi + di) % 5 === 0)
  )
}

export default function DashboardScreen() {
  const volunteer     = useAuthStore(selectVolunteer)
  const earnedBadges  = ['first_step'] // In production, fetched from DB
  const heatmapData   = generateHeatmapData()

  const points        = volunteer?.total_points ?? 0
  const streakMonths  = volunteer?.streak_months ?? 0
  const completed     = volunteer?.times_completed ?? 0
  const selected      = volunteer?.times_selected ?? 0
  const reliability   = selected > 0 ? Math.round((completed / selected) * 100) : 100

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white font-bold text-xl mb-4">My Impact</Text>

        {/* Progress ring centred */}
        <View className="items-center mb-6">
          <ProgressRing points={points} />
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-6">
          {[
            { label: 'Events completed', value: String(completed) },
            { label: 'Reliability',      value: `${reliability}%` },
            { label: 'Streak',           value: `${streakMonths}mo` },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 bg-surface border border-border rounded-2xl p-3 items-center">
              <Text className="text-gold font-bold text-xl">{stat.value}</Text>
              <Text className="text-muted text-xs text-center mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Streak */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-6 flex-row items-center justify-between">
          <Text className="text-white font-semibold">Active streak</Text>
          <StreakFlame months={streakMonths} />
        </View>

        {/* Activity heatmap */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <Text className="text-white font-semibold mb-3">Activity (last 12 weeks)</Text>
          <View className="flex-row gap-0.5">
            {heatmapData.map((week, wi) => (
              <View key={wi} className="gap-0.5">
                {week.map((active, di) => (
                  <HeatmapCell key={di} active={active} />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Badges */}
        <View>
          <Text className="text-white font-semibold mb-3">Badges</Text>
          <BadgeGrid earnedBadgeTypes={earnedBadges} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
