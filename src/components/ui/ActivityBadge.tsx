import { View, Text } from 'react-native'
import { ACTIVITY_LABELS, ACTIVITY_STYLES } from '@/constants/activities'
import type { ActivityType } from '@/types'

interface ActivityBadgeProps {
  type: ActivityType
  size?: 'sm' | 'md'
}

export function ActivityBadge({ type, size = 'md' }: ActivityBadgeProps) {
  const styles = ACTIVITY_STYLES[type]
  return (
    <View className={`self-start flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${styles.badge}`}>
      <View className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      <Text className={`font-semibold text-xs ${styles.text}`}>
        {ACTIVITY_LABELS[type]}
      </Text>
    </View>
  )
}
