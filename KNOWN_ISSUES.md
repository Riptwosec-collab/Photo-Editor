# Known Issues

## ISSUE-0001 — Browser E2E result pending
Severity: High
Affected module: QA/release
Description: Chromium workflow is defined but has not yet produced a passing PR result.
Status: TESTING
Assigned phase: 29

## ISSUE-0002 — Supabase migration unapplied
Severity: Critical
Affected module: Authentication/cloud projects/security
Description: Core schema and owner RLS exist in SQL but no target project is configured or permission-tested.
Status: READY
Assigned phase: 3/27

## ISSUE-0003 — Real AI provider unavailable
Severity: High
Affected module: AI infrastructure
Description: Current prompt planner is a clearly labeled local rule-based demo and does not inspect image pixels.
Status: MOCK
Assigned phase: 13

## ISSUE-0004 — Crop is centered only
Severity: Medium
Affected module: Crop/geometry
Description: Fixed aspect ratios, rotate and flip work; free handles, straighten and perspective do not.
Status: PARTIAL
Assigned phase: 9

## ISSUE-0005 — No masks or layers
Severity: High
Affected module: Local editing
Description: Professional masks, adjustment layers, blend modes and layer compositing are not implemented.
Status: NOT STARTED
Assigned phase: 10–11

## ISSUE-0006 — Browser color/metadata limitations
Severity: Medium
Affected module: Export
Description: Export is operationally sRGB but does not embed selectable ICC profiles or preserve EXIF; watermark is absent.
Status: PARTIAL
Assigned phase: 25

## ISSUE-0007 — Local-only persistence
Severity: High
Affected module: Projects/gallery/presets
Description: IndexedDB persistence works per browser/device; cloud sync, conflict resolution and backup are absent.
Status: PARTIAL
Assigned phase: 4/26

## ISSUE-0008 — Large-image performance not profiled
Severity: High
Affected module: Editor performance
Description: Preview size is bounded, but image processing still runs on the main thread without workers/tiles.
Status: PLANNED
Assigned phase: 28

## ISSUE-0009 — Advanced formats missing
Severity: Medium
Affected module: Import
Description: RAW, HEIC/HEIF, TIFF, PSD and ZIP albums are unsupported.
Status: NOT STARTED
Assigned phase: 5

## ISSUE-0010 — Batch pause semantics limited
Severity: Low
Affected module: Batch
Description: Stop-after-current works; durable pause/resume across reload and per-image overrides are absent.
Status: PARTIAL
Assigned phase: 20
