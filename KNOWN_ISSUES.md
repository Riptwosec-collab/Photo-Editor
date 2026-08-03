# Known Issues — LumaForge AI Studio

Last updated: 2026-08-03 17:30 (Asia/Bangkok)

## ISSUE-0001 — Previously audited source code unavailable

- Severity: Critical
- Affected module: Entire project / Phase 0
- Description: A prior session audited a real application at `/home/oai/share/ai-photo-editor`, but that ephemeral workspace is absent from the current runtime. The official repository `Riptwosec-collab/Photo-Editor` was found, but it contained no application source and has only been initialized with project-control documentation.
- Reproduction steps:
  1. Inspect the current runtime for the historical path.
  2. Search `/mnt/data` and File Library.
  3. Search connected GitHub repositories.
  4. Search connected Vercel projects.
- Expected behavior: The exact prior source is available for inspection and continuation.
- Actual behavior: The official repository is available, but only specifications/project-control documents are available; the application source is missing.
- Workaround: Restore/upload the exact application source into `Riptwosec-collab/Photo-Editor`.
- Status: BLOCKED
- Assigned phase: Phase 0 — Project Audit

## ISSUE-0002 — Current build, lint, type-check, and tests cannot run

- Severity: Critical
- Affected module: Quality validation
- Description: Current validation cannot run without the LumaForge package manifest and source tree. Historical PASS results cannot be promoted to current PASS.
- Reproduction steps: Attempt to locate and run the project in the current runtime.
- Expected behavior: Existing scripts execute and produce current evidence.
- Actual behavior: All current validation is NOT RUN.
- Workaround: Recover the source and rerun all scripts.
- Status: BLOCKED
- Assigned phase: Phase 0 — Project Audit

## ISSUE-0003 — Most historical feature surfaces were mock or UI-only

- Severity: High
- Affected module: Dashboard, editor, AI, beauty, batch, gallery, projects, marketplace, community, export
- Description: The prior audit recorded many rendered and interactive surfaces, but real persistence, processing, AI, and export behavior were not connected.
- Reproduction steps: Recover the prior source and trace each action to its state, API, database, processing worker, or provider.
- Expected behavior: Functional status is explicitly distinguished from UI/mock status.
- Actual behavior: Current source is unavailable; historical evidence indicates widespread mocks.
- Workaround: Preserve labels in the feature matrix and do not market mock behavior as functional.
- Status: BLOCKED
- Assigned phase: Phase 0 / subsequent implementation phases

## ISSUE-0004 — Automated tests were absent in the historical project

- Severity: High
- Affected module: Testing and QA
- Description: The prior audit found no automated unit, integration, or E2E suite despite successful build and type-check.
- Reproduction steps: Recover the source and inspect test scripts/configuration.
- Expected behavior: Critical editor, upload, AI job, persistence, export, and permission flows have tests.
- Actual behavior: No historical automated suite was available.
- Workaround: Add test infrastructure only after auditing the recovered architecture to avoid duplicate setup.
- Status: PLANNED
- Assigned phase: Phase 1 and Phase 29

## ISSUE-0005 — Backend, database, authentication, and RLS unverified

- Severity: Critical
- Affected module: Supabase/Auth/Storage/API
- Description: A Supabase client existed historically, but no verified production schema, migrations, ownership policies, storage policies, or complete authentication workflow were established in the audit record.
- Reproduction steps: Recover and inspect Supabase files, environment schema, API routes, and route guards.
- Expected behavior: Server authorization and RLS protect all private resources.
- Actual behavior: Unverified.
- Workaround: Do not connect production data until schema and policies are audited.
- Status: BLOCKED
- Assigned phase: Phase 0, Phase 3, Phase 27

## ISSUE-0006 — Real image editor and AI processing pipeline unverified

- Severity: Critical
- Affected module: Core editor, adjustments, masks, layers, AI, generative tools, export
- Description: Historical UI controls existed, but no current evidence proves WebGL/WebGPU/Canvas processing, non-destructive recipes, real AI providers, job states, or accurate export output.
- Reproduction steps: Recover source and test a real image from import through edit, undo/redo, save, reload, and export.
- Expected behavior: Preview and export reflect real non-destructive operations.
- Actual behavior: Historical modules were primarily mock/UI-only.
- Workaround: Keep all unsupported processing clearly labeled MOCK/NOT PRODUCTION.
- Status: BLOCKED
- Assigned phase: Phases 5–18 and Phase 25

## ISSUE-0007 — No matching production deployment found

- Severity: High
- Affected module: Deployment and release
- Description: The connected Vercel account contains many projects, but no identifiable LumaForge/photo-editor project was found. Generic projects inspected were unrelated or unavailable.
- Reproduction steps: List Vercel projects and search names/domains for LumaForge/photo editor.
- Expected behavior: A traceable deployment maps to the source repository and environment configuration.
- Actual behavior: No match found.
- Workaround: Link the recovered repository to a dedicated Vercel project after Phase 0 and release validation.
- Status: BLOCKED
- Assigned phase: Phase 30
