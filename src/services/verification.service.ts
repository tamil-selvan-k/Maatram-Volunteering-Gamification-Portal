import { supabase } from '@/lib/supabase/client'
import { toAppError } from '@/lib/errors'
import type { Result, Verification } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GpsCoords {
  lat: number
  lng: number
}

export interface PeerEntry {
  id: string
  full_name: string
  confirmed: boolean
}

// ─── Check-in ────────────────────────────────────────────────────────────────

/**
 * Record a volunteer's check-in for an event.
 * Creates or upserts the verification row for this registration.
 */
export async function checkIn(
  registrationId: string,
  location: GpsCoords | null,
  qrPayload: string
): Promise<Result<Verification>> {
  try {
    const now = new Date().toISOString()
    const locationStr = location ? `POINT(${location.lng} ${location.lat})` : null

    const { data, error } = await supabase
      .from('verifications')
      .upsert(
        {
          registration_id: registrationId,
          checkin_time: now,
          checkin_location: locationStr,
          qr_payload: qrPayload,
          verification_level: 'qr_partial',
        },
        { onConflict: 'registration_id' }
      )
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as unknown as Verification, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Check-out ────────────────────────────────────────────────────────────────

/**
 * Record a volunteer's check-out from an event.
 * Calculates verified_hours and upgrades the verification level to qr_full.
 */
export async function checkOut(
  verificationId: string,
  location: GpsCoords | null
): Promise<Result<Verification>> {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('verifications')
      .select('checkin_time, peer_confirms, photo_url')
      .eq('id', verificationId)
      .single()

    if (fetchErr) return { data: null, error: toAppError(fetchErr) }

    const now = new Date()
    const checkinMs = existing.checkin_time
      ? new Date(existing.checkin_time).getTime()
      : now.getTime()
    const verifiedHours = Math.max(
      0,
      Math.round(((now.getTime() - checkinMs) / 3_600_000) * 10) / 10
    )

    const peerConfirms = existing.peer_confirms ?? 0
    const level = peerConfirms >= 2 ? 'qr_peer' : 'qr_full'
    const locationStr = location ? `POINT(${location.lng} ${location.lat})` : null

    const { data, error } = await supabase
      .from('verifications')
      .update({
        checkout_time: now.toISOString(),
        checkout_location: locationStr,
        verified_hours: verifiedHours,
        verification_level: level,
      })
      .eq('id', verificationId)
      .select('*')
      .single()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as unknown as Verification, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Photo proof ─────────────────────────────────────────────────────────────

/**
 * Upload a photo proof image to Supabase Storage and link it to the verification.
 * The photo URI must be a local file path (camera capture, not gallery).
 */
export async function uploadPhotoProof(
  registrationId: string,
  photoUri: string,
  location: GpsCoords | null
): Promise<Result<{ url: string }>> {
  try {
    const response = await fetch(photoUri)
    const blob = await response.blob()
    const ext = photoUri.split('.').pop() ?? 'jpg'
    const path = `proof/${registrationId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true })

    if (uploadError) return { data: null, error: toAppError(uploadError) }

    const {
      data: { publicUrl },
    } = supabase.storage.from('proofs').getPublicUrl(path)

    const locationStr = location ? `POINT(${location.lng} ${location.lat})` : null

    const { error: updateError } = await supabase
      .from('verifications')
      .update({
        photo_url: publicUrl,
        photo_location: locationStr,
        verification_level: 'photo_pending',
      })
      .eq('registration_id', registrationId)

    if (updateError) return { data: null, error: toAppError(updateError) }
    return { data: { url: publicUrl }, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Peer confirmation ───────────────────────────────────────────────────────

/**
 * Submit a peer confirmation (confirmer attests that confirmed was present).
 * Inserts into peer_confirmations and manually increments peer_confirms counter.
 */
export async function submitPeerConfirmation(
  confirmerId: string,
  confirmedId: string,
  opportunityId: string
): Promise<Result<void>> {
  try {
    const { error } = await supabase.from('peer_confirmations').insert({
      confirmer_volunteer_id: confirmerId,
      confirmed_volunteer_id: confirmedId,
      opportunity_id: opportunityId,
    })

    if (error) return { data: null, error: toAppError(error) }

    // Find the registration/verification for the confirmed volunteer and increment count
    const { data: regData } = await supabase
      .from('registrations')
      .select('id')
      .eq('volunteer_id', confirmedId)
      .eq('opportunity_id', opportunityId)
      .maybeSingle()

    if (regData) {
      await supabase.rpc('increment_peer_confirms', {
        p_volunteer_id: confirmedId,
        p_opportunity_id: opportunityId,
      })
    }

    return { data: undefined, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

/**
 * Get the list of attendees for an event that the current user can confirm.
 * Excludes the current user. Marks who the user has already confirmed.
 */
export async function getPeerConfirmationList(
  opportunityId: string,
  currentUserId: string
): Promise<Result<PeerEntry[]>> {
  try {
    // Get all selected registrations (excluding self)
    const { data: regs, error: regErr } = await supabase
      .from('registrations')
      .select('volunteer_id')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'selected')
      .neq('volunteer_id', currentUserId)

    if (regErr) return { data: null, error: toAppError(regErr) }

    const volunteerIds = (regs ?? []).map((r) => r.volunteer_id)

    if (volunteerIds.length === 0) return { data: [], error: null }

    // Fetch volunteer names
    const { data: volunteers, error: volErr } = await supabase
      .from('volunteers')
      .select('id, full_name')
      .in('id', volunteerIds)

    if (volErr) return { data: null, error: toAppError(volErr) }

    // Fetch who the current user has already confirmed
    const { data: confs, error: confErr } = await supabase
      .from('peer_confirmations')
      .select('confirmed_volunteer_id')
      .eq('opportunity_id', opportunityId)
      .eq('confirmer_volunteer_id', currentUserId)

    if (confErr) return { data: null, error: toAppError(confErr) }

    const confirmedSet = new Set(
      (confs ?? []).map((c) => c.confirmed_volunteer_id)
    )

    const entries: PeerEntry[] = (volunteers ?? []).map((v) => ({
      id: v.id,
      full_name: v.full_name,
      confirmed: confirmedSet.has(v.id),
    }))

    return { data: entries, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}

// ─── Verification status ──────────────────────────────────────────────────────

/**
 * Fetch the current verification record for a registration.
 */
export async function getVerificationStatus(
  registrationId: string
): Promise<Result<Verification>> {
  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('registration_id', registrationId)
      .maybeSingle()

    if (error) return { data: null, error: toAppError(error) }
    return { data: data as unknown as Verification, error: null }
  } catch (err) {
    return { data: null, error: toAppError(err) }
  }
}
