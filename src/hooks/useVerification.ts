import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  checkIn,
  checkOut,
  uploadPhotoProof,
  submitPeerConfirmation,
  getPeerConfirmationList,
  getVerificationStatus,
  type GpsCoords,
} from '@/services/verification.service'
import { useAuthStore, selectVolunteer } from '@/stores/auth.store'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const VERIFICATION_KEYS = {
  all: ['verifications'] as const,
  status: (registrationId: string) =>
    ['verifications', 'status', registrationId] as const,
  peers: (opportunityId: string) =>
    ['verifications', 'peers', opportunityId] as const,
}

// ─── Check-in mutation ────────────────────────────────────────────────────────

interface CheckInVars {
  location: GpsCoords | null
  qrPayload: string
}

export function useCheckIn(registrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ location, qrPayload }: CheckInVars) =>
      checkIn(registrationId, location, qrPayload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: VERIFICATION_KEYS.status(registrationId),
      })
    },
  })
}

// ─── Check-out mutation ───────────────────────────────────────────────────────

interface CheckOutVars {
  verificationId: string
  location: GpsCoords | null
}

export function useCheckOut(registrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ verificationId, location }: CheckOutVars) =>
      checkOut(verificationId, location),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: VERIFICATION_KEYS.status(registrationId),
      })
    },
  })
}

// ─── Photo proof mutation ─────────────────────────────────────────────────────

interface PhotoProofVars {
  photoUri: string
  location: GpsCoords | null
}

export function usePhotoProof(registrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ photoUri, location }: PhotoProofVars) =>
      uploadPhotoProof(registrationId, photoUri, location),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: VERIFICATION_KEYS.status(registrationId),
      })
    },
  })
}

// ─── Peer confirmation ────────────────────────────────────────────────────────

interface PeerConfirmVars {
  confirmedId: string
}

export function usePeerConfirmation(opportunityId: string) {
  const queryClient = useQueryClient()
  const volunteer = useAuthStore(selectVolunteer)

  const peersQuery = useQuery({
    queryKey: VERIFICATION_KEYS.peers(opportunityId),
    queryFn: () => {
      if (!volunteer) throw new Error('Not authenticated')
      return getPeerConfirmationList(opportunityId, volunteer.id)
    },
    select: (result) => result.data ?? [],
    enabled: !!volunteer,
  })

  const confirmMutation = useMutation({
    mutationFn: ({ confirmedId }: PeerConfirmVars) => {
      if (!volunteer) throw new Error('Not authenticated')
      return submitPeerConfirmation(volunteer.id, confirmedId, opportunityId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: VERIFICATION_KEYS.peers(opportunityId),
      })
    },
  })

  return { peersQuery, confirmMutation }
}

// ─── Verification status query ────────────────────────────────────────────────

export function useVerificationStatus(registrationId: string) {
  return useQuery({
    queryKey: VERIFICATION_KEYS.status(registrationId),
    queryFn: () => getVerificationStatus(registrationId),
    select: (result) => result.data,
    enabled: !!registrationId,
  })
}
