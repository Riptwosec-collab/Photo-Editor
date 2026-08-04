# Known Issues

## ISSUE-0001 — Supabase cloud foundation incomplete
Severity: Critical
Affected modules: Authentication, Cloud, Projects, Gallery, Security
Description: Supabase restoration, schema application, private Storage and owner-isolation RLS tests are incomplete.
Status: BLOCKED
Assigned phase: 3/4/27

## ISSUE-0002 — Real AI providers unavailable
Severity: High
Affected modules: AI Assistant, AI Director, Beauty, Generative
Description: Current planning, suggestions and reference matching are local deterministic workflows. They do not perform trained scene segmentation, identity analysis or generation.
Status: PARTIAL / DEMO
Assigned phase: 13–19

## ISSUE-0003 — Masks and layers incomplete
Severity: High
Affected modules: Masking, selective editing, history
Description: Mask tool selection and overlay preview work, but local per-pixel adjustment compositing, layers, blend modes and opacity are incomplete.
Status: PARTIAL
Assigned phase: 10–11

## ISSUE-0004 — Advanced media formats unsupported
Severity: High
Affected module: Import/export
Description: RAW, HEIC/HEIF, TIFF, PSD and DNG encoding require native/WASM decoders or a server pipeline.
Status: NOT STARTED
Assigned phase: 5/25

## ISSUE-0005 — Lens correction unavailable
Severity: Medium
Affected module: Lens
Description: Camera/lens profile correction and chromatic aberration shaders are not implemented; controls remain disabled.
Status: NOT STARTED
Assigned phase: 7/28

## ISSUE-0006 — Perspective is an approximation
Severity: Medium
Affected module: Geometry
Description: Perspective uses reversible Canvas shear, not a full four-corner projective transform.
Status: PARTIAL
Assigned phase: 9

## ISSUE-0007 — Large-image processing remains on main thread
Severity: High
Affected module: Performance
Description: Preview dimensions are bounded, but Web Worker, OffscreenCanvas and tiled smart previews are not implemented.
Status: PLANNED
Assigned phase: 28

## ISSUE-0008 — Marketplace and collaboration absent
Severity: High
Affected modules: Marketplace, Projects, Share
Description: Catalog, payments, entitlements, project roles, comments, approval links and moderation are not implemented.
Status: NOT STARTED
Assigned phase: 23–24

## ISSUE-0009 — Vercel production deployment blocked
Severity: High
Affected module: Release
Description: Vercel rejected new production builds due to the current build-rate limit. Prior deployments are READY, but PR #2 is not deployed to production.
Status: BLOCKED
Assigned phase: 30

## ISSUE-0010 — Dependency advisories
Severity: High
Affected module: Supply-chain security
Description: `npm install` reports three high-severity advisories. A forced upgrade was not applied because it may introduce breaking changes; dependency-level remediation is required.
Status: OPEN
Assigned phase: 27

## ISSUE-0011 — Full accessibility and performance audits pending
Severity: Medium
Affected modules: Design system, mobile, performance
Description: Keyboard states and mobile flows are tested, but automated WCAG audit, screen-reader review and performance profiling are not complete.
Status: PLANNED
Assigned phase: 27–29
