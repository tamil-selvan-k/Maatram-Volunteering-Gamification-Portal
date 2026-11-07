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
    <View className={`self-start px-2.5 py-1 rounded-full ${styles.badge}`}>
      <Text className={`font-semibold text-xs ${size === 'sm' ? 'text-xs' : 'text-xs'} ${styles.text}`}>
        {ACTIVITY_LABELS[type]}
      </Text>
    </View>
  )
}
