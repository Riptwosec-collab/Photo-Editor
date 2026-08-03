# Development Plan — LumaForge AI Studio

Last updated: 2026-08-03 17:30 (Asia/Bangkok)
Planning basis: Supplied master build-control prompt and product specification
Plan status: BLOCKED AT PHASE 0

## Current Recovery Gate

A prior workspace was historically audited at approximately 18% weighted completion, but its source is unavailable in the current session. The official repository `Riptwosec-collab/Photo-Editor` is now initialized with project-control documents, but no implementation phase may resume until the exact application source is restored and Phase 0 validation is rerun. Historical build/type/lint results are context only, not current PASS evidence.

## Phase 0 — Project Audit

Objective: Establish the verified current state before implementation.

Scope:
- Inspect source tree, dependencies, routes, features, editor engine, AI adapters, Supabase, tests, build, lint, TypeScript, deployment, mocks, and interactive controls.

Dependencies:
- Existing repository or full source archive.

Tasks:
- Run install, development server, production build, lint, type-check, and tests.
- Audit routes, components, stores, APIs, database, security, accessibility, responsiveness, mocks, placeholders, and broken controls.
- Update all project-control documents.

Acceptance criteria:
- Current implementation is evidence-based and documented.
- Errors, mocks, partial features, and blockers are explicitly classified.
- One highest-priority next task is selected.

Testing requirements:
- Existing scripts must be executed and recorded exactly.

Completion status: BLOCKED
Completion percentage: 60% of the audit process (requirements review, historical-state reconstruction, repository bootstrap, and local/File Library/GitHub/Vercel recovery audit completed; current code inspection and validation remain unavailable).

## Phase 1 — Foundation and Architecture

Objective: Confirm or establish a maintainable production architecture without duplicating existing systems.
Scope: Feature folders, global types, design tokens, environment validation, logging, errors, state, API client, storage and AI abstractions, tests, layouts, navigation, loading/error boundaries.
Dependencies: Phase 0 complete.
Acceptance criteria: Build, lint, and type-check pass; architecture documented; no duplicate architecture.
Testing requirements: Unit tests for environment validation, API errors, and core state utilities.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 2 — Design System

Objective: Implement reusable, accessible, responsive dark/light UI primitives.
Scope: Tokens, typography, spacing, buttons, fields, sliders, dialogs, drawers, tooltips, tabs, menus, cards, toasts, skeletons, and states.
Dependencies: Phase 1.
Acceptance criteria: WCAG-aware reusable components across mobile, tablet, and desktop.
Testing requirements: Component tests, keyboard tests, visual responsive review.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 3 — Authentication and User Account

Objective: Secure user identity and personalized onboarding.
Scope: Email/Google authentication, guest mode, reset, protected routes, profile, sessions, logout, deletion, onboarding.
Dependencies: Foundation, Supabase schema, RLS.
Acceptance criteria: Secure sign-in/out, persistent sessions, correct route protection, functional errors.
Testing requirements: Auth integration and E2E flows.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 4 — Dashboard and Project Management

Objective: Persist and manage editing projects.
Scope: Dashboard, recent projects, create/rename/duplicate/delete/archive, status, cloud sync, storage, exports, quick actions.
Dependencies: Authentication and project schema.
Acceptance criteria: All project actions persist and handle loading/empty/error states.
Testing requirements: CRUD integration and E2E tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 5 — Image Import

Objective: Reliably ingest supported assets.
Scope: Picker, drag/drop, clipboard, camera, multi-file, metadata, thumbnails, validation, duplicates, progress, cancel, retry.
Dependencies: Project persistence, storage abstraction.
Acceptance criteria: Valid files import; invalid/corrupt files return useful errors; persistence verified.
Testing requirements: Upload validation, storage integration, browser compatibility.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 6 — Core Editor Canvas

Objective: Deliver a responsive, non-destructive editing workspace.
Scope: Rendering, load, zoom, pan, fit, actual size, full screen, compare, filmstrip, shortcuts, touch gestures, responsive panels.
Dependencies: Import and document state.
Acceptance criteria: Smooth interaction with large images and no source overwrite.
Testing requirements: Editor unit, integration, performance, pointer/touch E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 7 — Manual Adjustments

Objective: Implement real-time non-destructive tonal and detail controls.
Scope: Exposure through grain, reset, persistence, undo/redo.
Dependencies: Editor processing pipeline and history.
Acceptance criteria: Every control changes preview, persists, resets, and participates in history.
Testing requirements: Operation reducer, renderer parity, E2E sliders.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 8 — Color Tools

Objective: Add professional histogram, curves, HSL, grading, white balance, profiles, and matching.
Dependencies: Core processing pipeline.
Acceptance criteria: Real-time editable color operations with preset persistence and skin protection where applicable.
Testing requirements: Math/unit tests, renderer integration, visual baselines.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 9 — Crop and Geometry

Objective: Add reversible crop, rotate, straighten, perspective, overlays, and AI suggestions.
Dependencies: Editor transform model.
Acceptance criteria: Geometry persists and export matches preview.
Testing requirements: Transform unit tests and export integration.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 10 — Masking

Objective: Support editable global and AI-assisted local selections.
Dependencies: Canvas, segmentation abstraction, local adjustment model.
Acceptance criteria: Masks persist, combine, edit, and constrain adjustments with undo/redo.
Testing requirements: Mask algebra unit tests, persistence and rendering integration.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 11 — Layers and History

Objective: Add non-destructive layers, snapshots, branches, and restoration.
Dependencies: Document operation model.
Acceptance criteria: Layer/history changes persist and restore exact states.
Testing requirements: Reducer, serialization, branch and restore E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 12 — Presets

Objective: Build reusable preset creation, discovery, import/export, strength, and batch application.
Dependencies: Stable operation schema.
Acceptance criteria: Presets apply consistently and user presets persist.
Testing requirements: Serialization, compatibility, CRUD and E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 13 — AI Infrastructure

Objective: Establish transparent, resilient AI job execution.
Dependencies: Auth, credits, storage, API security.
Acceptance criteria: Typed mock/real providers, real job states, retry/cancel, timeouts, logs, fallback, no fake completion.
Testing requirements: Provider contract tests, job-state integration, failure tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 14 — AI Photo Analysis

Objective: Generate explainable scene, lighting, quality, composition, and edit suggestions.
Dependencies: AI infrastructure.
Acceptance criteria: Findings map to detected evidence; suggestions are selective and explained.
Testing requirements: Contract, confidence, fallback, UI integration tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 15 — Conversational AI Editor

Objective: Convert natural-language requests into reviewable structured edit plans.
Dependencies: AI analysis, operations, masks, history.
Acceptance criteria: Preview, affected regions, intensity, alternatives, explanation, partial undo, generative labels.
Testing requirements: Prompt-plan schema tests and E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 16 — Beauty Studio

Objective: Natural, identity-aware portrait retouching.
Dependencies: Face detection/landmarks, masking, history, AI safeguards.
Acceptance criteria: Identity controls default to zero, high-strength warnings, independent multi-person edits.
Testing requirements: Safety/identity, mask, UI and E2E tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 17 — Generative Tools

Objective: Object removal, replace, expand, background, relight, upscale, denoise, deblur, restore.
Dependencies: AI jobs, layer model, provenance.
Acceptance criteria: Generated pixels labeled, alternatives comparable, source preserved, retry supported.
Testing requirements: Job failure/retry, layer provenance, E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 18 — Reverse Preset and Style Match

Objective: Analyze a reference and generate editable reusable looks.
Dependencies: Color tools, AI analysis, preset schema.
Acceptance criteria: Source/reference separation, confidence, editable strength, reusable exports.
Testing requirements: Recipe output and compatibility tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 19 — Style DNA

Objective: Privacy-controlled personalization from edit behavior.
Dependencies: User preferences, analytics consent, preset/history data.
Acceptance criteria: Disable/reset/local-only/multiple profiles work; recommendations change with evidence.
Testing requirements: Privacy, deletion, preference and recommendation tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 20 — Batch Editing and Culling

Objective: Group, assess, synchronize, review, and export albums without automatic destructive deletion.
Dependencies: Import, editor operations, AI analysis, job queue.
Acceptance criteria: Pause/resume/cancel, outlier review, user-controlled picks, individual overrides.
Testing requirements: Large album, restart, consistency, culling E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 21 — Specialized Editing Studios

Objective: Focused workflows for product, food, automotive, real estate, night, portrait, and social content.
Dependencies: Shared editor engine and presets.
Acceptance criteria: No duplicated editor architecture; each studio has functional workflow.
Testing requirements: Studio-specific integration and E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 22 — Gallery and Asset Management

Objective: Search, organize, tag, rate, filter, trash, restore, and manage storage.
Dependencies: Assets, metadata, indexing.
Acceptance criteria: Combined filters and real project search work; trash is recoverable.
Testing requirements: Search/filter/persistence/E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 23 — Community and Marketplace

Objective: Secure creator sharing and verified commerce.
Dependencies: Profiles, permissions, payments, moderation.
Acceptance criteria: Posts persist, ownership enforced, purchases verified, downloads authorized.
Testing requirements: RLS, payment webhook, order entitlement, moderation E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 24 — Collaboration

Objective: Role-based project review, comments, versions, and approvals.
Dependencies: Realtime, project membership, versioning.
Acceptance criteria: Permissions match roles; comments and approvals persist.
Testing requirements: Role matrix, realtime, approval E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 25 — Export Center

Objective: Produce accurate files and platform/print outputs.
Dependencies: Renderer, storage, history, crop, adjustments.
Acceptance criteria: Export matches preview, respects operations, retries failures, explains unsupported formats.
Testing requirements: Format, metadata, dimensions, color, batch export tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 26 — Mobile, Tablet, and PWA

Objective: Purpose-built touch workflows and resilient offline capability.
Dependencies: Core editor and persistence.
Acceptance criteria: Core edits work on mobile, touch targets pass, offline/sync state visible, PWA install works.
Testing requirements: Device matrix, offline, gestures, responsive E2E.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 27 — Security, Privacy, and Accessibility

Objective: Enforce secure data access, privacy controls, and WCAG 2.2 AA.
Dependencies: All major data and UI workflows.
Acceptance criteria: Server authorization, RLS, validation, privacy rights, keyboard/screen reader/reduced motion compliance.
Testing requirements: RLS, authorization, upload, rate-limit, axe/manual accessibility tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 28 — Performance Optimization

Objective: Maintain responsiveness with large images and collections.
Dependencies: Feature-complete critical workflows.
Acceptance criteria: Documented memory, render, gallery, caching, bundle, worker, and database improvements.
Testing requirements: Benchmarks, profiling, memory and load tests.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 29 — Testing and QA

Objective: Validate all critical user and security flows.
Dependencies: Implemented product workflows.
Acceptance criteria: Critical E2E flows pass; no unresolved critical defects.
Testing requirements: Unit, integration, E2E, responsive, accessibility, security, upload, editor, AI, export, and database permissions.
Completion status: NOT STARTED
Completion percentage: 0%

## Phase 30 — Deployment and Release

Objective: Release safely with monitoring, backup, and rollback.
Dependencies: QA and release readiness.
Acceptance criteria: Production build/deployment pass; monitoring active; migrations, backup, rollback, and release notes documented.
Testing requirements: Environment validation, smoke tests, rollback rehearsal.
Completion status: NOT STARTED
Completion percentage: 0%
