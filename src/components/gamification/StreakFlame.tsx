import { View, Text } from 'react-native'

interface StreakFlameProps {
  months: number
  showLabel?: boolean
}

export function StreakFlame({ months, showLabel = true }: StreakFlameProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Text style={{ fontSize: 18 }}>🔥</Text>
      <Text className="font-bold text-white text-sm">{months}</Text>
      {showLabel && <Text className="text-muted text-xs">mo streak</Text>}
    </View>
  )
}
