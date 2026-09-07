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

- `npm run build` passed ESLint, TypeScript, 21 unit tests and the Next.js production build.
- Added tests for layer/mask history, snapshot copying, backup input restrictions, revision decisions, and signed AI receipt ownership, tampering and expiry.
- Playwright coverage added for draft recovery with layers, persisted batch/ZIP and theme/language, alongside editor, mobile and navigation flows. CI runs these before merge.
- Local browser interaction could not be verified: the available browser blocks localhost with `ERR_BLOCKED_BY_CLIENT`. Earlier browser startup/download attempts also failed. Browser test results must be checked in CI; no local browser pass is claimed.

## Activation and limits

Set the variables documented in `.env.example` on the server. AI requires a Supabase sign-in, an allowlisted user ID, a server-only Replicate token, pinned model versions and explicit cost labels. Model input names are configurable; inpainting must accept image, mask and prompt. Verify the selected model's input schema and white-mask semantics with a small test image before enabling accounts. Never put the provider token in a `NEXT_PUBLIC_` variable.

No live AI call was made and no live Supabase auth, storage, RLS or conflict test was possible without configured credentials. Existing database migrations are unchanged; layers are stored in edit-version geometry JSON. No production deployment or main merge was performed.

UI translations cover the main workflows and controls; provider diagnostics, some technical labels and legacy descriptions retain their source language. Subject/face segmentation, face reshaping and marketplace payments are not implemented. Worker fallback runs on the main thread in older browsers. Browser storage is quota-limited and may be evicted; project backups remain the portable recovery method. Metadata sidecars do not preserve embedded ICC profiles. AI edits are uploaded at a maximum 1536px long edge, and raster outputs are positioned in the current cropped frame.
