# Known Issues

## ISSUE-0001 — Full validation not executed
Severity: High. Current environment cannot install npm dependencies. Workaround: GitHub Actions or a network-enabled workstation. Status: BLOCKED.

## ISSUE-0002 — Sharpness and denoise are state-only
Severity: Medium. Values persist but dedicated processing kernels are not applied. Status: PARTIAL.

## ISSUE-0003 — Image binary is not persisted
Severity: High. Object URLs expire after reload; only adjustment recipes persist. Status: PARTIAL.

## ISSUE-0004 — Supabase migration unapplied
Severity: High. Core schema and RLS SQL exist but no target project is configured. Status: READY.

## ISSUE-0005 — AI provider is demo-only
Severity: Medium. Prompt plans use transparent rules and do not analyze pixels. Status: MOCK.

## ISSUE-0006 — Advanced editor modules missing
Severity: High. Curves, crop, masks, layers and durable versions are not implemented. Status: NOT STARTED.
