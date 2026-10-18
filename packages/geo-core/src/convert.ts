import {
  WGS84_A,
  WGS84_B,
  WGS84_E2,
  DEG_TO_RAD,
  RAD_TO_DEG,
} from "./constants.js";
import type { Geodetic, ECEF, ENU, Vec3 } from "./types.js";

/**
 * Convert geodetic (lat, lon, height) to ECEF.
 * Uses WGS84 ellipsoid closed-form solution.
 */
export function geodeticToEcef(geo: Geodetic): ECEF {
  const lat = geo.latitude * DEG_TO_RAD;
  const lon = geo.longitude * DEG_TO_RAD;
  const h = geo.height;

  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);

  // Radius of curvature in the prime vertical
  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);

  return {
    x: (N + h) * cosLat * cosLon,
    y: (N + h) * cosLat * sinLon,
    z: (N * (1 - WGS84_E2) + h) * sinLat,
  };
}

/**
 * Convert ECEF to geodetic using iterative Bowring method (sufficient for most GIS).
 * Handles poles and negative heights correctly.
 */
export function ecefToGeodetic(ecef: ECEF): Geodetic {
  const { x, y, z } = ecef;
  const p = Math.sqrt(x * x + y * y);

  // Longitude is exact
  let longitude = Math.atan2(y, x) * RAD_TO_DEG;
  // Normalize to [-180, 180]
  if (longitude > 180) longitude -= 360;
  if (longitude < -180) longitude += 360;

  // Special case: poles
  if (p < 1e-12) {
    return {
      latitude: z >= 0 ? 90 : -90,
      longitude: 0,
      height: Math.abs(z) - WGS84_B,
    };
  }

  // Iterative latitude
  let lat = Math.atan2(z, p * (1 - WGS84_E2));
  for (let i = 0; i < 10; i++) {
    const sinLat = Math.sin(lat);
    const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
    const h = p / Math.cos(lat) - N;
    const newLat = Math.atan2(z, p * (1 - (WGS84_E2 * N) / (N + h)));
    if (Math.abs(newLat - lat) < 1e-12) {
      lat = newLat;
      break;
    }
    lat = newLat;
  }

  const sinLat = Math.sin(lat);
  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  const height = p / Math.cos(lat) - N;

  return {
    latitude: lat * RAD_TO_DEG,
    longitude,
    height,
  };
}

/**
 * Build local ENU basis vectors at a geodetic reference point.
 * Returns unit vectors: east, north, up in ECEF frame.
 */
export function enuBasis(geo: Geodetic): { east: Vec3; north: Vec3; up: Vec3 } {
  const lat = geo.latitude * DEG_TO_RAD;
  const lon = geo.longitude * DEG_TO_RAD;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);

  return {
    east: { x: -sinLon, y: cosLon, z: 0 },
    north: {
      x: -sinLat * cosLon,
      y: -sinLat * sinLon,
      z: cosLat,
    },
    up: {
      x: cosLat * cosLon,
      y: cosLat * sinLon,
      z: sinLat,
    },
  };
}

/**
 * Convert ECEF delta to local ENU relative to a reference geodetic point.
 */
export function ecefToEnu(ecef: ECEF, ref: Geodetic): ENU {
  const refEcef = geodeticToEcef(ref);
  const dx = ecef.x - refEcef.x;
  const dy = ecef.y - refEcef.y;
  const dz = ecef.z - refEcef.z;
  const { east, north, up } = enuBasis(ref);

  return {
    east: east.x * dx + east.y * dy + east.z * dz,
    north: north.x * dx + north.y * dy + north.z * dz,
    up: up.x * dx + up.y * dy + up.z * dz,
  };
}

/**
 * Convert local ENU to ECEF given a reference geodetic point.
 */
export function enuToEcef(enu: ENU, ref: Geodetic): ECEF {
  const refEcef = geodeticToEcef(ref);
  const { east, north, up } = enuBasis(ref);

  return {
    x: refEcef.x + east.x * enu.east + north.x * enu.north + up.x * enu.up,
    y: refEcef.y + east.y * enu.east + north.y * enu.north + up.y * enu.up,
    z: refEcef.z + east.z * enu.east + north.z * enu.north + up.z * enu.up,
  };
}
