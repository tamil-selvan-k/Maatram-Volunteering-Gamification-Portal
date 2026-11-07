import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { getLevelInfo, getLevelProgress } from '@/utils'

interface ProgressRingProps {
  points: number
  size?: number
  strokeWidth?: number
}

export function ProgressRing({ points, size = 160, strokeWidth = 10 }: ProgressRingProps) {
  const { level, name, maxPoints } = getLevelInfo(points)
  const progress = getLevelProgress(points)
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const next = maxPoints === Infinity ? null : maxPoints - points

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute' }}
      >
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2A30"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F5B800"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View className="items-center">
        <Text className="text-white font-bold text-2xl">{points.toLocaleString()}</Text>
        <Text className="text-muted text-xs mt-0.5">
          Lv.{level} · {name}
        </Text>
        {next !== null && (
          <Text className="text-gold text-xs mt-0.5">{next.toLocaleString()} to next</Text>
        )}
      </View>
    </View>
  )
}
