/** Geographic coordinates in degrees (WGS84). Order: latitude, longitude, height. */
export interface Geodetic {
  /** Latitude in degrees, range [-90, 90] */
  latitude: number;
  /** Longitude in degrees, range [-180, 180] preferred */
  longitude: number;
  /** Height above ellipsoid in meters */
  height: number;
}

/** Earth-Centered, Earth-Fixed Cartesian coordinates in meters */
export interface ECEF {
  x: number;
  y: number;
  z: number;
}

/** Local East-North-Up coordinates in meters relative to a reference point */
export interface ENU {
  east: number;
  north: number;
  up: number;
}

/** 3D Cartesian vector */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
