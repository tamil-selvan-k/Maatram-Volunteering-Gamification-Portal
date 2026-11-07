/**
 * Haversine geo utilities for GPS distance validation.
 * Used to enforce that check-ins happen within 500m of the event venue.
 */

const EARTH_RADIUS_M = 6_371_000

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Haversine formula — returns distance between two lat/lng points in metres.
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

/**
 * Returns true if the user is within 500m of the event location.
 */
export function isWithin500m(
  userLat: number,
  userLng: number,
  eventLat: number,
  eventLng: number
): boolean {
  return distanceMeters(userLat, userLng, eventLat, eventLng) <= 500
}
