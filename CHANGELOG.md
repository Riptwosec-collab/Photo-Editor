# Changelog

## 2026-08-03 — Functional expansion

### Added
- Canonical Next.js 16/React 19 application.
- Responsive dark-first application shell and truthful module pages.
- JPG/PNG/WebP import through picker, drag/drop, clipboard and camera.
- Shared Canvas renderer and non-destructive edit state.
- Light/color/detail effects, real sharpness and denoise kernels.
- Live RGB histogram, composite tone curve and 8-color HSL mixer.
- Reversible crop ratios, rotation and flips.
- Undo/redo and durable project snapshots.
- IndexedDB project/gallery lifecycle management.
- Local batch processing queue and real export statuses.
- JPEG/PNG/WebP Export Center with quality, long-edge resize, crop override, Instagram preset and history.
- Personal preset save/search/rename/duplicate/delete and JSON import/export.
- Guest session and optional Supabase magic-link foundation.
- PWA shell/service worker.
- Initial Supabase schema/RLS migration, not applied.
- Core unit tests, Vercel validation and Chromium E2E workflow.

### Fixed
- Invalid icon import that blocked the first deployment.
- React effect lint issue in project loading.
- Previous sharpness/denoise state-only limitation.
- Preview/export processing divergence by sharing one renderer.

### Security
- Added request validation, upload checks, hardening headers and draft owner RLS.
- Preset JSON import rejects unsupported/non-numeric adjustment keys.
- No fake cloud AI, checkout, collaboration or sync success states are shown.

### Known limitations
- Browser E2E, Supabase RLS and full accessibility/security/performance audits remain release gates.
- Advanced AI, masks/layers, beauty, generative editing and marketplace/collaboration are incomplete.
