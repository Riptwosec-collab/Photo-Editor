# Test Report

Date: 2026-08-03

## Latest completed application validation

| Check | Result | Evidence |
|---|---|---|
| Dependency installation | PASS | GitHub Actions and Vercel installed dependencies successfully |
| ESLint | PASS | 0 errors, 0 warnings |
| Full TypeScript | PASS | `tsc --noEmit` |
| Core unit tests | PASS | 7 tests, 7 pass, 0 fail |
| Next.js production build | PASS | All current application routes generated |
| Vercel preview deployment | PASS | Preview deployment reported Ready |
| Chromium Browser E2E | PASS | 3 tests, 3 pass, 0 fail |
| Supabase migration | NOT RUN | No target project configured |
| RLS permission tests | NOT RUN | Migration unapplied |
| Accessibility audit | NOT RUN | Manual/automated audit pending |
| Performance profiling | NOT RUN | Worker/tile work pending |
| Dependency vulnerability remediation | PARTIAL | `npm install` reports 3 high-severity advisories; remediation requires dependency-level review |

## Unit coverage evidence

- Neutral default adjustment/geometry recipe.
- Built-in preset keys.
- AI demo transparency label and rule output.
- Center crop aspect-ratio math.
- Denoise/detail filter behavior and alpha preservation.
- Neutral tone-curve identity LUT.
- Neutral HSL mixer color preservation.

## Passing Chromium E2E flows

1. Landing page opens the functional editor.
2. A real PNG payload uploads and renders to Canvas.
3. Exposure changes and Undo restores the prior value.
4. Project save persists the image and edit recipe to IndexedDB.
5. Snapshot creation succeeds.
6. Project dashboard displays the saved project.
7. Export Center downloads the Instagram JPEG preset and reports success.
8. Personal preset creation appears in the Preset Library.

## Defects found and fixed during E2E

- Added `HTMLImageElement.decode()` fallback when `createImageBitmap()` fails.
- Changed the persistent status toast to ignore pointer events so it cannot block editor controls.
- Tightened accessible E2E locators for sliders and export status.
- Retained traces, screenshots and video on future failures.

A feature remains below COMPLETE until its required browser, database, security, accessibility and performance tests pass.
