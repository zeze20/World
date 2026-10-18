# ADR-001: Technology stack

## Status

Accepted (2026-10-18)

## Context

Need a web-first 3D globe with fast MVP delivery, good ecosystem for tiles/terrain, and path to replace render engine later.

## Decision

- TypeScript strict + React + Vite
- CesiumJS for globe, camera, imagery, atmosphere
- pnpm monorepo
- Zustand for UI state
- Custom `@aetherglobe/geo-core` for geodetic math (testable, engine-agnostic)

## Consequences

- Fast path to interactive globe
- Cesium bundle size is non-trivial; monitor performance budgets
- Adapter interface around Cesium allows future WebGPU / custom engine migration
