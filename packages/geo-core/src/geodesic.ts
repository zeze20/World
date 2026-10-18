import { EARTH_MEAN_RADIUS, DEG_TO_RAD, RAD_TO_DEG } from "./constants.js";
import type { Geodetic } from "./types.js";

/**
 * Great-circle (spherical) distance in meters using haversine formula.
 * Sufficient for most UI measurements; for high-precision use Vincenty later.
 */
export function haversineDistance(a: Geodetic, b: Geodetic): number {
  const lat1 = a.latitude * DEG_TO_RAD;
  const lat2 = b.latitude * DEG_TO_RAD;
  const dLat = (b.latitude - a.latitude) * DEG_TO_RAD;
  const dLon = (b.longitude - a.longitude) * DEG_TO_RAD;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * EARTH_MEAN_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Initial bearing from a to b in degrees [0, 360).
 */
export function initialBearing(a: Geodetic, b: Geodetic): number {
  const lat1 = a.latitude * DEG_TO_RAD;
  const lat2 = b.latitude * DEG_TO_RAD;
  const dLon = (b.longitude - a.longitude) * DEG_TO_RAD;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * RAD_TO_DEG;
  return (bearing + 360) % 360;
}

/**
 * Format distance for UI (meters → m or km).
 */
export function formatDistance(meters: number, locale = "tr-TR"): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toLocaleString(locale, {
    maximumFractionDigits: 2,
  })} km`;
}
