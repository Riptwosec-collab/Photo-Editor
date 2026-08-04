# Test Report

Date: 2026-08-04
Validated head: `1b0da580d9b806aa906c994688b554da961f7ec0`
GitHub Actions run: `30904005721`

## Automated Validation

| Check | Result | Evidence |
|---|---|---|
| Dependency installation | PASS | GitHub Actions Node 22 |
| ESLint | PASS | 0 errors, 0 warnings |
| Strict TypeScript | PASS | `tsc --noEmit` |
| Unit tests | PASS | 10 tests, 10 pass, 0 fail |
| Next.js production build | PASS | All canonical routes generated |
| Desktop Chromium E2E | PASS | 3 tests, 3 pass, 0 fail |
| Mobile Pixel 7 E2E | PASS | 1 test, 1 pass, 0 fail |
| Supabase migration | NOT RUN | Cloud target not ready/verified |
| RLS permission tests | NOT RUN | Migration and test identities pending |
| Vercel production deployment | BLOCKED | Build-rate limit |
| Dependency audit remediation | PARTIAL | Three high advisories remain |
| WCAG audit | NOT RUN | Dedicated audit pending |
| Performance profile | NOT RUN | Worker/tile implementation pending |

## Unit Coverage

- Neutral default adjustment and geometry schema.
- Preset key validity.
- Explicit AI demo labeling.
- Fixed and free crop math.
- Denoise/detail behavior and alpha preservation.
- Neutral tone-curve identity LUT.
- Neutral HSL color preservation.
- Advanced tonal parameter pixel changes.
- Bounded reference color matching.
- Intensity recipe scaling.

## Desktop Browser Flow

1. Landing opens the canonical editor.
2. PNG imports and renders both original and edited canvases.
3. Before/After labels and comparison are visible.
4. Exposure changes and Undo restores the neutral value.
5. Project saves to IndexedDB.
6. Version History opens from the toolbar.
7. Snapshot creation succeeds.
8. Project appears on Projects.
9. Instagram JPEG export downloads and records success.
10. AI Auto Enhance Cinematic mode changes the shared Contrast control.
11. Personal preset remains in the canonical Preset Library.

## Mobile Browser Flow

1. Mobile bottom navigation renders.
2. AI Assistant and Inspector start collapsed for a canvas-first experience.
3. PNG import renders the comparison canvas.
4. Inspector opens as a bottom sheet and Exposure changes.
5. Inspector collapses without losing the edit.
6. AI Assistant opens as a drawer and the prompt/scene controls are accessible.
7. Edit is the active mobile navigation destination.
