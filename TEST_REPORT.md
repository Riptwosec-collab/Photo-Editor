# Test Report

Date: 2026-08-03
Deployment validation source: Vercel build for commit `22d54e1`

| Check | Result | Evidence |
|---|---|---|
| Dependency install | PASS | 372 packages installed/restored |
| ESLint | PASS WITH 2 WARNINGS | 0 errors; warning cleanup committed |
| Full TypeScript | PASS | `tsc --noEmit` |
| Core unit tests | PASS | 3 tests, 3 pass, 0 fail |
| Next.js production build | PASS | Next.js 16.1.1 compiled and generated all routes |
| Route generation | PASS | `/`, `/editor`, `/[section]`, `/api/ai/plan`, manifest |
| Deployment | PASS | Vercel deployment completed and reached READY |
| Playwright E2E | NOT RUN | Browser suite defined but not executed |
| Supabase migration | NOT RUN | No target project configured |

## Unit evidence
- Neutral default recipe passed.
- Preset keys passed schema assertion.
- Local AI plan retained explicit DEMO labeling and cinematic rule.

## Remaining release gates
- Warning-free rebuild of cleanup commit.
- Browser upload/edit/undo/export E2E with real fixtures.
- Supabase RLS application and permission tests.
- Accessibility and security audits.
