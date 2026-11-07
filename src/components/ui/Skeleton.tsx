import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

interface SkeletonProps {
  className?: string
  height?: number
}

export function Skeleton({ className = '', height = 16 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{ opacity, height }}
      className={`bg-surface-elevated rounded-lg ${className}`}
    />
  )
}
