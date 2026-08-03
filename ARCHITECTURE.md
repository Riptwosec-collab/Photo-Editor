# Architecture — LumaForge AI Studio

Last updated: 2026-08-03 17:30 (Asia/Bangkok)
Architecture status: HISTORICAL PARTIAL / CURRENTLY UNVERIFIED

## Important Evidence Boundary

This document records the target architecture derived from the supplied specification. A prior audit historically observed a Next.js 16.1.1, React 19.2.3, TypeScript, Tailwind CSS 4, Zustand, and Supabase-client application, but the source is unavailable in the current runtime. The official repository is now available but contains no application source. The restored source must be inspected before adopting, changing, or duplicating this plan.

## Target Stack

### Frontend

- Next.js 16 and React 19
- Strict TypeScript
- Tailwind CSS and shadcn/ui
- Motion for restrained transitions
- Zustand for editor/client state domains
- TanStack Query for server state
- React Hook Form and Zod for forms and validation

### Image Processing

- Canvas API with WebGL/WebGPU capability detection
- OffscreenCanvas and Web Workers for non-blocking transforms
- WebAssembly/OpenCV.js for selected CV operations
- Tiled previews and smart-preview pipeline for large images
- Non-destructive edit recipes rather than source mutation

### Backend and Data

- Supabase Auth, PostgreSQL, Storage, Realtime, and Edge Functions
- Row Level Security and server-side authorization
- Migrations for every schema change
- Background AI/export job abstraction
- Optional R2/CDN/Redis/GPU provider depending on verified needs

## Proposed Feature-Based Structure

```text
src/
  app/
  components/
    ui/
  features/
    auth/
    projects/
    import/
    editor/
      canvas/
      adjustments/
      color/
      crop/
      masks/
      layers/
      history/
      presets/
    ai/
    beauty/
    batch/
    gallery/
    community/
    marketplace/
    collaboration/
    export/
    settings/
  lib/
    api/
    env/
    errors/
    logging/
    storage/
    validation/
  workers/
  types/
supabase/
  migrations/
  functions/
tests/
  unit/
  integration/
  e2e/
```

This is a proposed structure only. Reuse the actual existing architecture when equivalent modules already exist.

## Editor State Domains

- Document state: assets, versions, operation graph, persistence identifiers.
- Canvas state: viewport, zoom, pan, preview quality, comparison mode.
- Tool state: active tool and transient parameters.
- Selection state: selected asset, layer, mask, person, or region.
- Layer state: ordered non-destructive layers and blend settings.
- Mask state: masks, operations, overlays, feather/refinement metadata.
- History state: undo, redo, snapshots, branches, crash recovery.
- AI job state: provider, state machine, progress evidence, retry/cancel.
- Export state: output recipes, jobs, history, errors.
- Sync state: local/cloud revision, pending writes, conflict state.
- Preferences: appearance, performance, privacy, shortcuts, editor behavior.

## Non-Destructive Data Model

The original asset must remain immutable. Edits should be represented as typed operations and versioned documents. Generated or reconstructed pixels should be stored as separate, provenance-labeled assets/layers.

## AI Provider Contract

The AI layer should expose typed capabilities and job contracts rather than embedding provider calls in UI components.

Required concepts:
- Capability discovery.
- Typed request/response schemas.
- Mock provider explicitly labeled NOT PRODUCTION.
- Real provider adapter.
- Queue state machine: queued, uploading, processing, preview, completed, failed, cancelled, retrying.
- Timeout, retry, cancellation, credits, audit logs, and fallback.
- Provenance and identity-impact metadata.

## Security Boundaries

- Client checks are UX only; authorization must be enforced server-side and in RLS.
- Asset and project ownership must be validated for reads, writes, exports, sharing, and AI jobs.
- File contents must be decoded/validated, not trusted by extension alone.
- Payment entitlements must rely on verified server events.
- Face analysis, Style DNA, and cloud processing require explicit privacy controls.

## Validation Gate

No architecture migration or project scaffolding should begin until the existing repository is available and equivalent structures have been checked for duplication.
