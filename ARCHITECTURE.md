# Architecture — LumaForge AI Studio

## Current implementation
- Next.js 16 App Router and React 19.
- Zustand domains for document recipe, history, viewport and comparison state.
- Canvas 2D renderer with bounded preview and larger export rendering.
- LocalStorage persistence for recipes and history; image bytes remain memory-only.
- Zod-validated route handler for AI edit plans.
- Local rule-based demo provider separated from UI and explicitly identified.
- TanStack Query shared provider.
- Responsive application shell with truthful module-status pages.
- Initial Supabase profiles/projects/assets/edit_versions schema with RLS.

## Processing model
Browser-supported images are decoded into a Canvas preview. Pixel operations are calculated against RGBA data. Export uses the same recipe at a larger bounded resolution. Originals are never overwritten.

## Required next architecture
- IndexedDB project cache and crash recovery.
- Supabase Auth, Storage and applied RLS.
- Web Worker/OffscreenCanvas and tiled rendering.
- True sharpening and denoise kernels.
- Curves, crop, geometry, masks, layers and version branches.
- Typed AI provider interface, durable jobs, timeout/fallback, audit logs and credit ledger.
