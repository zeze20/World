/**
 * WGS84 ellipsoid constants.
 * Source: NIMA TR8350.2, Department of Defense World Geodetic System 1984.
 * Units: meters unless noted.
 */

/** Semi-major axis (equatorial radius) in meters */
export const WGS84_A = 6378137.0;

/** Flattening */
export const WGS84_F = 1 / 298.257223563;

/** Semi-minor axis (polar radius) in meters */
export const WGS84_B = WGS84_A * (1 - WGS84_F);

/** First eccentricity squared: e² = 2f - f² */
export const WGS84_E2 = WGS84_F * (2 - WGS84_F);

/** Second eccentricity squared */
export const WGS84_EP2 = (WGS84_A * WGS84_A - WGS84_B * WGS84_B) / (WGS84_B * WGS84_B);

/** Mean Earth radius approximation (meters) – for rough calculations only */
export const EARTH_MEAN_RADIUS = 6371008.8;

/** Degrees ↔ radians helpers */
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
