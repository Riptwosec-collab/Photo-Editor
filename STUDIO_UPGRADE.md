# LumaForge studio upgrade

## Implemented

- Responsive animated home, searchable command menu, mobile navigation and functional workflow launchers.
- Blue Glass, Midnight and Graphite themes; Thai/English interface translations; reduced motion, performance preview, focus mode, mobile panel height and pinch zoom.
- Abortable OffscreenCanvas worker rendering with a compatible canvas fallback. Editor preview, histogram, recipe thumbnails, export and batch use the shared layer renderer.
- Adjustment, text and AI raster layers with visibility, opacity, ordering and undo/redo. Whole-image, radial, linear and brush masks, brush erasing and inversion. Up to 20 layers; masks use post-crop normalized coordinates.
- IndexedDB draft autosaving, recover/discard controls, editable original-plus-recipe project backup import/export, bounded file validation. Saved projects still support the existing autosave preference.
- Preset intensity, rendered previews, favorites, personal folders, history/version previews and undoable snapshot restoration.
- Export previews use the actual encoded download Blob and show its exact size. Format/quality/long-edge controls, output presets, watermark and JPEG background. Optional allowlisted camera/GPS metadata is exported as a separate JSON file; embedded metadata is stripped by canvas export.
- Persisted batch queue with per-image looks, selection, pause after current, resume, retry, individual downloads and ZIP. Sequential processing; 50 files and 200 MB input cap.
- Measured local light analysis and Director suggestions without artificial progress timers. Director recipe and crop are one undoable snapshot. Auto Enhance can apply to the selected adjustment layer through its mask.
- Optional authenticated Replicate jobs for background removal and masked inpainting: explicit upload consent and configured cost label, polling, cancellation, recoverable signed receipt, output preview and accepting a result as a layer. Results cannot be accepted after the source recipe changes.
- Cloud sync compares content hashes and server revisions instead of device clocks. Immutable upload assets and edit versions precede a conditional revision update. Conflict resolution saves the losing copy locally before replacing anything.

## Validation

- Updated Next.js and its ESLint config to 16.3.4 and fflate to 0.8.3 after auditing dependencies. `npm audit --json` reports zero known vulnerabilities on 2026-09-08.

- `npm run build` passed ESLint, TypeScript, 21 unit tests and the Next.js production build.
- Added tests for layer/mask history, snapshot copying, backup input restrictions, revision decisions, and signed AI receipt ownership, tampering and expiry.
- Playwright coverage added for draft recovery with layers, persisted batch/ZIP and theme/language, alongside editor, mobile and navigation flows. CI runs these before merge.
- Local browser interaction could not be verified: the available browser blocks localhost with `ERR_BLOCKED_BY_CLIENT`. Earlier browser startup/download attempts also failed. Browser test results must be checked in CI; no local browser pass is claimed.

## Activation and limits

Set the variables documented in `.env.example` on the server. AI requires a Supabase sign-in, an allowlisted user ID, a server-only Replicate token, pinned model versions and explicit cost labels. Model input names are configurable; inpainting must accept image, mask and prompt. Verify the selected model's input schema and white-mask semantics with a small test image before enabling accounts. Never put the provider token in a `NEXT_PUBLIC_` variable.

No live AI call was made and no live Supabase auth, storage, RLS or conflict test was possible without configured credentials. Existing database migrations are unchanged; layers are stored in edit-version geometry JSON. No production deployment or main merge was performed.

UI translations cover the main workflows and controls; provider diagnostics, some technical labels and legacy descriptions retain their source language. Subject/face segmentation, face reshaping and marketplace payments are not implemented. Worker fallback runs on the main thread in older browsers. Browser storage is quota-limited and may be evicted; project backups remain the portable recovery method. Metadata sidecars do not preserve embedded ICC profiles. AI edits are uploaded at a maximum 1536px long edge, and raster outputs are positioned in the current cropped frame.

## Creative/library upgrade — 8 September 2026

Implemented in the follow-up to PR #4:

- HEIC/HEIF import in the editor and batch queue. Native decoding is attempted first, then an on-demand heic2any decoder. Conversion produces a JPEG on the device, uses the first frame, and does not retain original EXIF or the HEIC container. Keep the source file separately. No real iPhone/HEIC fixture validation has been completed in this environment.
- Five-point independent RGB channel curves, strict 3D `.cube` parsing (size 2–33), trilinear sampling, reversible LUT layers, intensity via opacity and up to 30 personal color recipes in IndexedDB. New layer data is preserved in drafts, portable backups and cloud versions.
- Manual portrait layers for skin texture, shine reduction and face lighting. Clone blemishes uses a user-positioned clean source, feathered spots and undo. These tools do not detect faces or reshape identity.
- Product, square post, vertical 9:16 story and profile templates. Crop changes and editable text layers are applied in one undoable snapshot.
- Albums, tags, multi-field search, exact SHA-256 source duplicate detection and recoverable trash. Album/tag/trash metadata participates in cloud conflict detection. Trash retains original images and versions; it is not a permanent cloud purge.
- A cancellable single-decode queue, lazy offscreen thumbnails and early canvas-buffer release. Editor previews request reduced decode dimensions for large originals, accounting for crop magnification. Full export retains the full decode path. These changes reduce work and peak concurrency but are not a guarantee that every device can export 48 MP.
- Additional Thai/English creative/library controls and larger touch targets. Some legacy diagnostics retain English; real iPhone testing remains outstanding.
- Optional semantic selection provider for person/sky/background/object. It must return a white-on-black raster mask, which is converted to alpha and can be refined with feather/invert/brush. Model credentials and an appropriate pinned version are required; no live segmentation quality claim is made.
- Durable server-side AI allowance reservations, per-user daily job limits, shared daily estimated allowance, account-scoped usage history and recoverable provider receipts. Failed/uncertain attempts remain reserved to avoid accidental retry spending. The app's estimated allowance is not a cap on the provider's final bill; configure a hard provider spending limit independently.

The additive `lumaforge_ai_usage_budget` migration was applied to the connected Supabase project. `supabase/tests/lumaforge_owner_budget.sql` passed against it: project/usage owner isolation, cross-owner write denial, per-account job limits and shared allowance enforcement. All synthetic test data was rolled back. Existing private storage policies were inspected. This does not certify a full browser login/upload/download or cross-device recovery session.

Paid jobs fail closed until all values in `.env.example` are supplied (including the server-only Supabase service key, explicit allowance values, allowlisted users, provider token and pinned model versions). No credentials were committed, no paid model job was started, and no production promotion was performed. The repository contains an older legacy `0001_core_schema.sql` with a different project schema: do not blindly replay all historical migrations against a fresh/shared database. The connected project uses the timestamped cloud foundation schema.

Validation: local lint, TypeScript, unit tests and production build; new Playwright scenarios cover template/RGB draft recovery, LUT application/rejection and library duplicate/trash recovery on desktop and mobile. Final CI status is recorded on PR #4.
