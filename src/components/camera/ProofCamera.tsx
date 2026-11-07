import React, { memo, useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import { Camera, X, AlertTriangle, MapPin } from 'lucide-react-native'
import { COLORS } from '@/constants/theme'
import type { GpsCoords } from '@/services/verification.service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProofCameraProps {
  onCapture: (photoUri: string, location: GpsCoords | null) => Promise<void>
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProofCamera = memo(function ProofCamera({
  onCapture,
  onClose,
}: ProofCameraProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'ok' | 'denied'>('idle')
  const [gps, setGps] = useState<GpsCoords | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  const now = new Date()
  const timestamp = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  /** Fetch GPS coordinates. */
  const fetchLocation = useCallback(async (): Promise<GpsCoords | null> => {
    setLocationStatus('fetching')
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setLocationStatus('denied')
      return null
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })
    const coords: GpsCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    }
    setGps(coords)
    setLocationStatus('ok')
    return coords
  }, [])

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return
    setIsCapturing(true)

    try {
      // Get GPS first
      const coords = await fetchLocation()

      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      if (!photo) throw new Error('Failed to capture photo')
      await onCapture(photo.uri, coords)
    } catch (err: unknown) {
      console.error('[ProofCamera] capture error', err)
    } finally {
      setIsCapturing(false)
    }
  }, [fetchLocation, isCapturing, onCapture])

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
        <Camera size={40} color={COLORS.muted} />
        <Text style={styles.permText}>Camera access is required to upload photo proof.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* Watermark overlay — GPS + timestamp */}
      <View style={styles.watermark} pointerEvents="none">
        <View style={styles.watermarkRow}>
          <MapPin size={12} color={COLORS.gold} />
          <Text style={styles.watermarkText}>
            {gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : 'GPS pending…'}
          </Text>
        </View>
        <Text style={styles.watermarkText}>{timestamp}</Text>
      </View>

      {/* Anti-gaming notice */}
      <View style={styles.notice} pointerEvents="none">
        <AlertTriangle size={14} color={COLORS.warning} />
        <Text style={styles.noticeText}>
          Photo must be taken at the event location. Gallery picks are not allowed.
        </Text>
      </View>

      {/* GPS status pill */}
      {locationStatus === 'denied' && (
        <View style={styles.gpsDenied}>
          <Text style={styles.gpsDeniedText}>
            Location denied — photo will be uploaded without GPS watermark
          </Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {/* Close */}
        <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.7}>
          <X size={22} color={COLORS.white} />
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          onPress={handleCapture}
          style={[styles.shutter, isCapturing && { opacity: 0.6 }]}
          disabled={isCapturing}
          activeOpacity={0.8}
        >
          {isCapturing ? (
            <ActivityIndicator color={COLORS.bg} size="small" />
          ) : (
            <Camera size={28} color={COLORS.bg} />
          )}
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ width: 44 }} />
      </View>
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
  actionBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: COLORS.bg,
    fontWeight: '700',
    fontSize: 15,
  },
  watermark: {
    position: 'absolute',
    bottom: 140,
    left: 12,
    right: 12,
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 8,
    borderRadius: 8,
  },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watermarkText: {
    color: COLORS.gold,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  notice: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  noticeText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 12,
    lineHeight: 17,
  },
  gpsDenied: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(239,68,68,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  gpsDeniedText: {
    color: COLORS.error,
    fontSize: 12,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
})
