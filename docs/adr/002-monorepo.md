# ADR-002: Monorepo

## Status

Accepted (2026-10-18)

## Context

Multiple packages (geo-core, future tiles/terrain/vector, web app) need shared versioning and easy local linking.

## Decision

pnpm workspaces under single repository `aetherglobe`.

## Consequences

- Single CI, single version line for MVP
- Easy to extract packages later if needed
