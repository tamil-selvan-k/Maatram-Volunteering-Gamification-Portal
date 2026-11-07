import { ScrollView, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'
import { useBadges, useActivityHeatmap } from '@/hooks/useLeaderboard'
import { ProgressRing } from '@/components/gamification/ProgressRing'
import { StreakFlame } from '@/components/gamification/StreakFlame'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { Skeleton } from '@/components/ui/Skeleton'
import { COLORS } from '@/constants/theme'

const WEEKS = 12
const DAYS  = 7

function HeatmapCell({ intensity }: { intensity: number }) {
  const alpha = intensity === 0 ? 0 : Math.min(0.3 + intensity * 0.7, 1)
  return (
    <View
      className="rounded-sm"
      style={{
        width: 14,
        height: 14,
        margin: 1,
        backgroundColor: intensity > 0 ? COLORS.gold : COLORS.surfaceElevated,
        opacity: intensity > 0 ? alpha : 0.4,
      }}
    />
  )
}

function buildHeatmapGrid(heatmap: Record<string, number>): number[][] {
  const today = new Date()
  const maxPoints = Math.max(...Object.values(heatmap), 1)
  return Array.from({ length: WEEKS }, (_, wi) =>
    Array.from({ length: DAYS }, (_, di) => {
      const d = new Date(today)
      d.setDate(d.getDate() - ((WEEKS - 1 - wi) * 7 + (DAYS - 1 - di)))
      const key = d.toISOString().slice(0, 10)
      const pts = heatmap[key] ?? 0
      return pts / maxPoints
    })
  )
}

export default function DashboardScreen() {
  const volunteer = useAuthStore(selectVolunteer)
  const { data: earnedBadges = [], isLoading: badgesLoading } = useBadges(volunteer?.id)
  const { data: heatmapRaw = {}, isLoading: heatmapLoading } = useActivityHeatmap(volunteer?.id)

  const points       = volunteer?.total_points ?? 0
  const streakMonths = volunteer?.streak_months ?? 0
  const completed    = volunteer?.times_completed ?? 0
  const selected     = volunteer?.times_selected ?? 0
  const reliability  = selected > 0 ? Math.round((completed / selected) * 100) : 100

  const heatmapGrid = buildHeatmapGrid(heatmapRaw)

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white font-bold text-xl mb-4">My Impact</Text>

        <View className="items-center mb-6">
          <ProgressRing points={points} />
        </View>

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

        <View className="bg-surface border border-border rounded-2xl p-4 mb-6 flex-row items-center justify-between">
          <Text className="text-white font-semibold">Active streak</Text>
          <StreakFlame months={streakMonths} />
        </View>

        <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
          <Text className="text-white font-semibold mb-3">Activity (last 12 weeks)</Text>
          {heatmapLoading ? (
            <Skeleton height={14 * DAYS + 8} />
          ) : (
            <View className="flex-row gap-0.5">
              {heatmapGrid.map((week, wi) => (
                <View key={wi} className="gap-0.5">
                  {week.map((intensity, di) => (
                    <HeatmapCell key={di} intensity={intensity} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        <View>
          <Text className="text-white font-semibold mb-3">Badges</Text>
          {badgesLoading ? (
            <Skeleton height={80} />
          ) : earnedBadges.length === 0 ? (
            <View className="bg-surface border border-border rounded-2xl p-6 items-center">
              <Text className="text-2xl mb-3">🔒</Text>
              <Text className="text-white font-semibold text-sm text-center mb-1">
                No badges yet
              </Text>
              <Text className="text-muted text-xs text-center">
                Complete your first verified event to unlock badges!
              </Text>
            </View>
          ) : (
            <BadgeGrid earnedBadgeTypes={earnedBadges} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
