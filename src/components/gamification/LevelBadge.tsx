import { View, Text } from 'react-native'
import { getLevelInfo } from '@/utils'

interface LevelBadgeProps {
  points: number
  size?: 'sm' | 'md'
}

export function LevelBadge({ points, size = 'md' }: LevelBadgeProps) {
  const { level, name } = getLevelInfo(points)
  return (
    <View
      className={`flex-row items-center gap-1 bg-gold/10 border border-gold/30 rounded-full ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}
    >
      <Text className={`text-gold font-bold ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
        Lv.{level}
      </Text>
      <Text className={`text-gold/70 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>{name}</Text>
    </View>
  )
}
