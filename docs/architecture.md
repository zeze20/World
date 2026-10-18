# AetherGlobe Architecture (MVP)

## Goals

- Independent of Google Earth / Maps data and branding
- Modular, testable geo and render layers
- Provider-agnostic imagery, terrain and search
- Progressive enhancement from a working vertical slice

## Current stack

| Layer        | Choice              |
|--------------|---------------------|
| Language     | TypeScript (strict) |
| UI           | React 18 + Vite     |
| 3D engine    | CesiumJS            |
| State        | Zustand             |
| i18n         | i18next             |
| Geo math     | `@aetherglobe/geo-core` |
| Package mgr  | pnpm workspaces     |

## Module boundaries

- `geo-core`: pure math (WGS84, ECEF, ENU, geodesic). No DOM, no Cesium.
- `apps/web`: React shell, Cesium viewer adapter, UI, local storage.
- Future packages (`tiles`, `terrain`, `vector`, `search`) will sit behind interfaces.

## Data flow

```
User input → UI → ViewerHandle / store → Cesium camera / entities
Nominatim (search) → results → flyTo
localStorage ← bookmarks
```

## Non-goals (MVP)

- Backend auth/sync
- Custom WebGPU renderer
- Full 3D cities / photogrammetry
- Commercial high-res satellite archive
