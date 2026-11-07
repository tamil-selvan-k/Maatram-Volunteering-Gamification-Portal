import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { X, CheckCircle, XCircle } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanState = 'scanning' | 'processing' | 'success' | 'error'

interface QRScannerProps {
  onScan: (payload: string) => Promise<void>
  onClose: () => void
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get('window')
const FRAME = Math.min(W, H) * 0.65
const CORNER = 24
const THICKNESS = 3

// ─── Corner bracket ───────────────────────────────────────────────────────────

function Corner({ top, left, right, bottom }: {
  top?: boolean; left?: boolean; right?: boolean; bottom?: boolean
}) {
  return (
    <View
      style={[
        styles.corner,
        top    !== undefined && { top: 0 },
        bottom !== undefined && { bottom: 0 },
        left   !== undefined && { left: 0 },
        right  !== undefined && { right: 0 },
        top    !== undefined && left  !== undefined && { borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderTopLeftRadius: CORNER },
        top    !== undefined && right !== undefined && { borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderTopRightRadius: CORNER },
        bottom !== undefined && left  !== undefined && { borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderBottomLeftRadius: CORNER },
        bottom !== undefined && right !== undefined && { borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderBottomRightRadius: CORNER },
      ]}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const QRScanner = memo(function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [statusMsg, setStatusMsg] = useState('')
  const isProcessing = useRef(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scan line animation
  const scanY = useSharedValue(0)

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [scanY])

  // Clean up the error-reset timer on unmount to prevent state updates on an unmounted component
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }
    }
  }, [])

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * FRAME }],
  }))

  const handleBarcode = useCallback(
    async (result: BarcodeScanningResult) => {
      if (isProcessing.current) return
      if (scanState !== 'scanning') return
      isProcessing.current = true

      setScanState('processing')
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      try {
        await onScan(result.data)
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setScanState('success')
        setStatusMsg('Check-in successful!')
      } catch (err: unknown) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setScanState('error')
        const msg =
          err instanceof Error ? err.message : 'QR code not valid for this event'
        setStatusMsg(msg)
        // Auto-reset after 3 seconds
        resetTimerRef.current = setTimeout(() => {
          setScanState('scanning')
          isProcessing.current = false
          resetTimerRef.current = null
        }, 3000)
      }
    },
    [onScan, scanState]
  )

  // Permission gate
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanState === 'scanning' ? handleBarcode : undefined}
      />

      {/* Dark overlay with clear frame */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Top mask */}
        <View style={[styles.mask, { height: (H - FRAME) / 2 }]} />

        {/* Middle row */}
        <View style={{ flexDirection: 'row', height: FRAME }}>
          <View style={[styles.mask, { width: (W - FRAME) / 2 }]} />

          {/* Scan frame */}
          <View style={styles.frame}>
            <Corner top left />
            <Corner top right />
            <Corner bottom left />
            <Corner bottom right />

            {/* Animated scan line */}
            {scanState === 'scanning' && (
              <Animated.View style={[styles.scanLine, scanLineStyle]} />
            )}
          </View>

          <View style={[styles.mask, { width: (W - FRAME) / 2 }]} />
        </View>

        {/* Bottom mask */}
        <View style={[styles.mask, { flex: 1 }]} />
      </View>

      {/* Status overlay */}
      {scanState !== 'scanning' && (
        <View style={styles.statusContainer}>
          {scanState === 'processing' && (
            <>
              <ActivityIndicator color={COLORS.gold} size="large" />
              <Text style={styles.statusText}>Verifying…</Text>
            </>
          )}
          {scanState === 'success' && (
            <>
              <CheckCircle size={48} color={COLORS.success} />
              <Text style={[styles.statusText, { color: COLORS.success }]}>
                {statusMsg}
              </Text>
            </>
          )}
          {scanState === 'error' && (
            <>
              <XCircle size={48} color={COLORS.error} />
              <Text style={[styles.statusText, { color: COLORS.error }]}>
                {statusMsg}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Hint text */}
      {scanState === 'scanning' && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Align the QR code within the frame</Text>
        </View>
      )}

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <X size={22} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  )
})

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    gap: 16,
    padding: 32,
  },
  permText: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permBtnText: {
    color: COLORS.bg,
    fontWeight: '700',
    fontSize: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'column',
  },
  mask: {
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  frame: {
    width: FRAME,
    height: FRAME,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: COLORS.gold,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: COLORS.gold,
    opacity: 0.8,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  hintContainer: {
    position: 'absolute',
    bottom: (H - FRAME) / 2 - 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
  statusContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
