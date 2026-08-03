# Project Audit — LumaForge AI Studio

Audit date: 2026-08-03
Evidence: Current GitHub source, Vercel build logs and core test output

## Stack
- Next.js 16.1.1, React 19.2.3, strict TypeScript, Tailwind CSS 4
- Zustand, TanStack Query, Canvas 2D
- IndexedDB v3: projects, versions, exports, presets
- Optional Supabase client and unapplied SQL/RLS migration
- Zod API validation, Playwright and Node tests

## Routes
`/`, `/editor`, `/auth`, `/projects`, `/gallery`, `/batch`, `/presets`, `/export-center`, `/api/ai/plan` plus truthful status routes.

## Functional findings
- JPG/PNG/WebP import by picker, drop, clipboard and camera.
- Preview, histogram, batch and export share the renderer.
- Light/color, curve, HSL, sharpness, denoise, clarity, grain and vignette alter pixels.
- Crop/rotate/flip are non-destructive and undoable.
- Projects store image blobs and recipes; snapshots restore recipes.
- Batch progress reflects real processing results.
- Export history records successful encodes only.
- Preset JSON accepts known numeric keys only.

## Partial/missing
- Centered crop only; no free crop/straighten/perspective.
- Composite curve only; no RGB channels or grading wheels.
- PWA shell only; no complete offline sync/conflicts.
- Supabase unapplied; AI is prompt-rule demo.
- Masks/layers, RAW, beauty/generative tools, collaboration/marketplace absent.
- E2E requires passing PR run.

## Recommended task
Pass E2E, then implement Supabase Auth/Storage/RLS with permission tests.
