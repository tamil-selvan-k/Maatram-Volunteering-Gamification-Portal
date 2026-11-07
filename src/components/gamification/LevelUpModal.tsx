import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, Animated, Easing } from 'react-native'
import { COLORS } from '@/constants/theme'
import { useUIStore } from '@/stores/ui.store'

// ─── Zustand hook ─────────────────────────────────────────────────────────────
export function useLevelUpModal() {
  const show = useUIStore((s) => s.levelUpModal.show)
  const levelName = useUIStore((s) => s.levelUpModal.levelName)
  const levelNumber = useUIStore((s) => s.levelUpModal.levelNumber)
  const dismiss = useUIStore((s) => s.dismissLevelUp)
  return { show, levelName, levelNumber, dismiss }
}

// ─── Particle offsets ─────────────────────────────────────────────────────────
const OFFSETS: [number, number][] = [
  [-60, -80],
  [60, -80],
  [-100, -30],
  [100, -30],
  [-50, 40],
  [50, 40],
]

interface ParticleProps {
  index: number
  animValue: Animated.Value
}

function Particle({ index, animValue }: ParticleProps) {
  const [dx, dy] = OFFSETS[index % OFFSETS.length] ?? [0, 0]
  const delay = index * 80 + 200

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dx],
  })
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dy],
  })
  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: index % 2 === 0 ? COLORS.gold : COLORS.goldLight,
        transform: [
          { translateX: Animated.add(
            new Animated.Value(0),
            translateX
          )},
          { translateY: Animated.add(
            new Animated.Value(0),
            translateY
          )},
        ],
        opacity,
      }}
    />
  )
}

// ─── Modal content (mounted while visible) ───────────────────────────────────
function LevelUpContent({
  levelName,
  levelNumber,
  dismiss,
}: {
  levelName: string
  levelNumber: number
  dismiss: () => void
}) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const particleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Scale + fade in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Particles fire slightly later
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [scaleAnim, opacityAnim, particleAnim])

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 48,
        backgroundColor: COLORS.surface,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: COLORS.gold,
        minWidth: 280,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      {/* Particles */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Particle key={i} index={i} animValue={particleAnim} />
      ))}

      {/* Level badge */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: `${COLORS.gold}20`,
          borderWidth: 3,
          borderColor: COLORS.gold,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 28 }}>
          {levelNumber}
        </Text>
      </View>

      <Text
        style={{
          color: COLORS.gold,
          fontWeight: '800',
          fontSize: 22,
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        You levelled up!
      </Text>
      <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 18, marginBottom: 8 }}>
        {levelName}
      </Text>
      <Text style={{ color: COLORS.muted, fontSize: 13 }}>Tap to dismiss</Text>
    </Animated.View>
  )
}

// ─── LevelUpModal ─────────────────────────────────────────────────────────────
export function LevelUpModal() {
  const { show, levelName, levelNumber, dismiss } = useLevelUpModal()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (show) {
      timerRef.current = setTimeout(dismiss, 3000)
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [show, dismiss])

  if (!show) return null

  return (
    <Modal
      visible={show}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        activeOpacity={1}
        onPress={dismiss}
      >
        <LevelUpContent
          levelName={levelName}
          levelNumber={levelNumber}
          dismiss={dismiss}
        />
      </TouchableOpacity>
    </Modal>
  )
}
