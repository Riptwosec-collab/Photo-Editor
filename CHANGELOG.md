# Changelog

## 2026-08-03

### Added
- Next.js 16 / React 19 / strict TypeScript foundation.
- Responsive dark-first application shell.
- Functional JPG/PNG/WebP import with validation.
- Canvas pixel renderer for core light, color, grain and vignette adjustments.
- Zoom, pan, original comparison, local autosave, undo and redo.
- Five built-in presets.
- Zod-validated `/api/ai/plan` endpoint with transparent local demo provider.
- JPEG/PNG browser export path.
- Truthful module status pages.
- Initial Supabase schema and RLS, not applied.
- Unit/E2E definitions and GitHub Actions CI.

### Changed
- Project advanced from recovery-only documentation to functional browser-editor MVP.
- Weighted completion updated from 18% historical to 31% evidence-qualified.
- Build pipeline now executes lint, type-check, unit tests and Next production build.

### Fixed
- Replaced an invalid Lucide `Batch` icon import.
- Removed all ESLint warnings from the validated build.

### Validation
- Lint PASS with zero warnings.
- Type-check PASS.
- Unit tests PASS 3/3.
- Production build PASS.
- Vercel deployment READY.

### Security
- Added hardening headers, upload checks, request validation and draft owner RLS.

### Known limitations
- Sharpness and denoise are state-only.
- Supabase migration is not applied.
- Advanced modules remain incomplete.
