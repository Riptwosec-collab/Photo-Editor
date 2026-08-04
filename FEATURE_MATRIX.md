# Feature Matrix — LumaForge AI Studio

Last updated: 2026-08-04 17:35 (Asia/Bangkok)

| Feature | UI | Logic | Persistence/API | Responsive | Validation | Status | Notes |
|---|---|---|---|---|---|---|---|
| Canonical navigation | Yes | Yes | Route redirects | Yes | Build + desktop/mobile E2E | TESTED | One canonical destination per product area |
| Five-region editor shell | Yes | Yes | UI state persisted | Yes | Desktop/mobile E2E | TESTED | Toolbar, assistant, canvas, inspector, filmstrip |
| Sidebar collapse | Yes | Yes | Zustand | Desktop/tablet | Build | FUNCTIONAL | Icon tooltips via titles |
| Top toolbar | Yes | Yes | Local save/share/export entry | Yes | Desktop E2E | TESTED | Project title, undo/redo, versions, compare, preview, share, export |
| AI Assistant | Yes | Yes | `/api/ai/plan` | Drawer on mobile | Build | FUNCTIONAL DEMO | Local rule-based planning; no vision claim |
| Scene Understanding | Yes | Heuristic | Local file/state | Yes | Build | PARTIAL | File/orientation/state analysis only |
| AI suggestions | Yes | Yes | Shared editor history | Yes | Unit/build | FUNCTIONAL DEMO | Strength, preview, individual/apply-selected |
| AI Director | Yes | Yes | Shared recipe | Yes | Build | FUNCTIONAL DEMO | Analyze/Plan/Edit, progress/cancel/retry |
| AI Auto Enhance | Yes | Yes | Shared recipe + presets | Yes | Desktop E2E | TESTED LOCAL | Nine modes, intensity, selective targets, locks |
| Reverse Preset | Yes | Yes | IndexedDB + downloads | Yes | Unit/build | FUNCTIONAL LOCAL | Internal/XMP/LUT/JSON; DNG disabled truthfully |
| Color Consistency | Yes | Yes | Current + album IndexedDB | Yes | Unit/build | FUNCTIONAL LOCAL | Local average-color/luminance matching |
| Before/After | Yes | Yes | Shared geometry/state | Yes | Desktop/mobile E2E | TESTED | Vertical, horizontal, blink, four-grid |
| Canvas navigation | Yes | Yes | View state | Yes | E2E | TESTED | Zoom, wheel, pan, fit, 100%, fullscreen |
| Canvas overlays | Yes | Yes | UI state | Yes | Build | FUNCTIONAL | Grid, guides, safe zones, clipping, mask preview |
| RGB/luminance histogram | Yes | Yes | Shared renderer | Yes | Build | FUNCTIONAL | Live clipping percentages and metadata |
| Manual Light controls | Yes | Yes | Shared recipe/history | Yes | Unit + E2E | TESTED | 12 controls, direct numeric entry and reset |
| HSL mixer | Yes | Yes | Shared recipe | Yes | Unit | TESTED | Eight color ranges |
| Tone Curve | Yes | Yes | Shared recipe | Yes | Unit/build | FUNCTIONAL | Composite RGB curve; channel curves pending |
| Color Grading | Yes | Yes | Shared recipe | Yes | Unit/build | FUNCTIONAL | Shadow/midtone/highlight hue and saturation |
| Detail/Effects | Yes | Yes | Shared renderer | Yes | Unit | TESTED | Texture, clarity, dehaze, sharpening, denoise, grain, vignette |
| Geometry | Yes | Yes | Shared recipe/history | Yes | Unit | PARTIAL | Free crop, ratios, rotate, flip, straighten, shear perspective |
| Lens profiles | Disabled state | No | None | Yes | Build | NOT STARTED | Disabled rather than reporting fake correction |
| Masking | Overlay/tools | Partial | UI state | Yes | Build | PARTIAL | Overlay works; local adjustment compositing pending |
| Layers | Status only | No | None | N/A | No | NOT STARTED | One shared history remains canonical |
| Filmstrip | Yes | Yes | IndexedDB/localStorage | Yes | Mobile/desktop build | FUNCTIONAL | Multi-select, rating, labels, favorite, reject, sync edits |
| Project autosave | Yes | Yes | IndexedDB | Yes | Desktop E2E | TESTED | Image and recipe persist locally |
| Version history | Yes | Yes | IndexedDB | Yes | Desktop E2E | TESTED | Snapshot, duplicate, branch, restore, rename, delete |
| Personal presets | Yes | Yes | IndexedDB/JSON | Yes | Desktop E2E | TESTED | Existing canonical preset system preserved |
| Batch editing | Yes | Yes | Local queue | Yes | Build | PARTIAL | Real render queue; AI culling/durable pause pending |
| Gallery/projects | Yes | Yes | IndexedDB | Yes | Desktop E2E | TESTED LOCAL | Distinct responsibilities retained |
| Export Center | Yes | Yes | Export history | Yes | Desktop E2E | TESTED | JPEG/PNG/WebP, quality, resize, crop, social preset |
| Cloud | Status/state | No production sync | Supabase draft | Yes | Not run | BLOCKED | Restore/migration/RLS/Storage pending |
| Authentication | Yes | Partial | Optional Supabase | Yes | Build | PARTIAL | Guest/local works; production account lifecycle pending |
| Beauty Studio | Canonical status | Global portrait mode | Shared recipe | Yes | Build | PLANNED | Segmentation and per-person controls pending |
| Marketplace | Canonical status | No checkout | None | Yes | Build | NOT STARTED | No fake catalog/payment states |
| Collaboration | Share entry | Partial | Browser share only | Yes | Build | NOT STARTED | Project roles/comments/review links pending |
| Desktop release gate | N/A | N/A | CI | Desktop | 3/3 PASS | TESTED | Import, compare, edit, undo, save, versions, export, presets |
| Mobile release gate | N/A | N/A | CI | Pixel 7 | PASS | TESTED | Canvas-first, bottom nav, inspector and AI drawers |
