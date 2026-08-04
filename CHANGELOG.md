# Changelog

## 2026-08-04 — Reference-driven professional editor upgrade

### Added

- Five-region professional editor layout.
- Canonical grouped navigation and duplicate-route redirects.
- Unified AI Assistant with scene context, prompt plans, suggestions, confidence and protection states.
- AI Director Analyze → Plan → Edit workflow.
- Nine AI Auto Enhance modes, selective targets and protection locks.
- Reverse Preset Generator with local pixel sampling and Internal/XMP/LUT/JSON outputs.
- Cross-photo Color Consistency for current photo and saved albums.
- Before/After vertical, horizontal, blink and four-grid comparison.
- Advanced Light, Color Grading, Detail and Geometry controls.
- Free crop, straighten and perspective approximation.
- Filmstrip multi-select, ratings, color labels, favorite, reject, copied settings and edit sync.
- Version duplicate and branch actions.
- Mobile canvas-first bottom sheets and mobile browser release gate.
- Internal Reference Feature Integration Audit.

### Changed

- Manual and AI-assisted edits now share one history and recipe.
- Original and edited comparisons now share geometry.
- Existing Histogram, HSL, Tone Curve, Geometry, Presets and Export systems were upgraded or embedded instead of duplicated.
- Old duplicate route names now redirect to canonical routes.
- AI Studio, Beauty Studio, Cloud and Marketplace status pages use canonical ownership and truthful capability states.

### Fixed

- React 19 effect lint violations.
- Strict TypeScript metadata and `FileList` issues.
- Ambiguous E2E locators for Version History, Cinematic mode and Contrast.
- Mobile panels obscuring the canvas on initial load.
- Original/edited compare misalignment after geometry changes.

### Validation

- Lint: PASS, 0 warnings.
- TypeScript: PASS.
- Unit tests: 10/10 PASS.
- Next production build: PASS.
- Desktop Chromium: 3/3 PASS.
- Mobile Pixel 7: PASS.

### Known limitations

- Cloud/RLS, trained AI, RAW, lens profiles, mask/layer compositing, Beauty segmentation, marketplace and collaboration remain incomplete.
- Vercel deployment remains blocked by build-rate limits.
