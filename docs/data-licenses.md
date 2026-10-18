# Data licenses registry

Update this file before adding any new data source to production.

| Provider            | Type          | Coverage | Resolution | License / ToS              | Attribution required | Cache allowed | Redistribution | Cost / quota | Production risk | Status |
|---------------------|---------------|----------|------------|----------------------------|----------------------|---------------|----------------|--------------|-----------------|--------|
| OpenStreetMap tiles | Raster        | Global   | Zoom 0–19  | ODbL + Tile Usage Policy   | Yes                  | Limited       | No (tiles)     | Free (fair use) | Rate-limit abuse | Verify before heavy use |
| Nominatim           | Geocoding     | Global   | —          | ODbL + Nominatim Usage     | Yes                  | Yes (short)   | Results OK     | Free (fair use) | Heavy load blocked | Use own instance for prod |
| geo-countries / NE  | Vector GeoJSON| Global   | Country    | Public Domain (Natural Earth lineage) | Appreciated | Yes        | Yes            | Free           | Low             | Used for borders layer |
| Cesium World Terrain| DEM / mesh    | Global   | Variable   | Cesium ion Terms           | Yes                  | Per ToS       | No             | Token required | License / cost  | Optional via env token |
| WGS84 ellipsoid     | Math model    | Global   | —          | N/A                        | No                   | N/A           | N/A            | Free           | None            | Default terrain |

**Rule:** Do not ship data with unclear license. Prefer Public Domain / ODbL with clear attribution.

Last reviewed: 2026-10-18
