# Data licenses registry

Update this file before adding any new data source to production.

| Provider            | Type          | Coverage | Resolution | License / ToS              | Attribution required | Cache allowed | Redistribution | Cost / quota | Production risk | Status |
|---------------------|---------------|----------|------------|----------------------------|----------------------|---------------|----------------|--------------|-----------------|--------|
| OpenStreetMap tiles | Raster        | Global   | Zoom 0–19  | ODbL + Tile Usage Policy   | Yes                  | Limited       | No (tiles)     | Free (fair use) | Rate-limit abuse | Verify before heavy use |
| Nominatim           | Geocoding     | Global   | —          | ODbL + Nominatim Usage     | Yes                  | Yes (short)   | Results OK     | Free (fair use) | Heavy load blocked | Use own instance for prod |
| Natural Earth       | Vector/raster | Global   | Low–med    | Public Domain              | Appreciated          | Yes           | Yes            | Free           | Low             | Recommended |
| Cesium default      | Raster        | Global   | Varies     | Cesium / provider ToS      | Yes                  | Per ToS       | No             | May need ion   | License change  | Document ion token if used |

**Rule:** Do not ship data with unclear license. Prefer Public Domain / ODbL with clear attribution over ambiguous “open data”.

Last reviewed: 2026-10-18
