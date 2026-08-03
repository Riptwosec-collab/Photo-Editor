# Architecture — LumaForge AI Studio

## Runtime architecture

- Next.js 16 App Router and React 19.
- Strict TypeScript.
- Zustand editor domain: image reference, adjustment recipe, geometry, viewport, history and active preset.
- Canvas 2D shared renderer used by preview, histogram sampling, batch and export.
- Local rule-based AI provider behind a validated route; provider is marked DEMO.
- IndexedDB v3 stores projects, image blobs, snapshots, export history and personal presets.
- LocalStorage stores bounded editor history/draft recipe.
- Optional Supabase browser client remains inactive without environment variables.

## Processing order

1. Decode supported browser image.
2. Apply non-destructive crop/rotation/flip transform.
3. Apply exposure and tonal controls.
4. Apply composite tone-curve LUT.
5. Apply global color and HSL mixer.
6. Apply clarity, grain, denoise and sharpening.
7. Apply vignette.
8. Draw preview or encode export.

This ordering is shared to reduce preview/export divergence.

## Persistence domains

- `projects`: image Blob, dimensions, recipe, geometry and lifecycle metadata.
- `versions`: named recipe/geometry snapshots linked to a project.
- `exports`: successful format/settings/output records.
- `presets`: user recipe definitions and scope.

Deleting a project also removes its versions and export history. Personal presets remain independent.

## API/security boundary

- `POST /api/ai/plan` validates prompt length through Zod.
- Upload type/size/decode are validated client-side; server upload does not yet exist.
- Security headers are configured.
- Supabase SQL includes owner fields/indexes/RLS but remains unapplied.

## Required evolution

- Move pixel work to Web Worker/OffscreenCanvas and add tiled smart previews.
- Add free crop/perspective data model.
- Add masks, layers and local-adjustment compositing.
- Add real AI provider interface, job state machine, audit log, rate limiting and fallback.
- Add Supabase Auth/Storage/Realtime with tested RLS.
- Add durable offline sync and conflict resolution.
