import { describe, it, expect } from "vitest";
import { geodeticToEcef, ecefToGeodetic } from "./convert.js";
import type { Geodetic } from "./types.js";

describe("geodeticToEcef / ecefToGeodetic", () => {
  it("round-trips equator (0,0,0)", () => {
    const geo: Geodetic = { latitude: 0, longitude: 0, height: 0 };
    const ecef = geodeticToEcef(geo);
    expect(ecef.x).toBeCloseTo(6378137, 0);
    expect(ecef.y).toBeCloseTo(0, 5);
    expect(ecef.z).toBeCloseTo(0, 5);

    const back = ecefToGeodetic(ecef);
    expect(back.latitude).toBeCloseTo(0, 8);
    expect(back.longitude).toBeCloseTo(0, 8);
    expect(back.height).toBeCloseTo(0, 3);
  });

  it("round-trips Istanbul", () => {
    const geo: Geodetic = {
      latitude: 41.0082,
      longitude: 28.9784,
      height: 100,
    };
    const ecef = geodeticToEcef(geo);
    const back = ecefToGeodetic(ecef);
    expect(back.latitude).toBeCloseTo(geo.latitude, 6);
    expect(back.longitude).toBeCloseTo(geo.longitude, 6);
    expect(back.height).toBeCloseTo(geo.height, 2);
  });

  it("handles north pole", () => {
    const geo: Geodetic = { latitude: 90, longitude: 0, height: 0 };
    const ecef = geodeticToEcef(geo);
    expect(ecef.x).toBeCloseTo(0, 3);
    expect(ecef.y).toBeCloseTo(0, 3);
    expect(ecef.z).toBeGreaterThan(6350000);

    const back = ecefToGeodetic(ecef);
    expect(back.latitude).toBeCloseTo(90, 5);
  });

  it("handles negative height", () => {
    const geo: Geodetic = { latitude: 0, longitude: 0, height: -100 };
    const ecef = geodeticToEcef(geo);
    const back = ecefToGeodetic(ecef);
    expect(back.height).toBeCloseTo(-100, 2);
  });
});
