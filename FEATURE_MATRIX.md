# Feature Matrix — LumaForge AI Studio

Last updated: 2026-08-03 18:45 (Asia/Bangkok)

| Feature | UI | Frontend Logic | Backend | Database | AI Integration | Responsive | Tested | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Foundation and shell | Yes | Yes | API route | Migration draft | Demo abstraction | Yes | Build/unit | TESTED | Production build passes |
| Guest authentication | Yes | Yes | Optional Supabase | Local session | N/A | Yes | Build | PARTIAL | Cloud auth unconfigured |
| Project CRUD | Yes | Yes | No cloud | IndexedDB | N/A | Yes | E2E pending | FUNCTIONAL | Save/open/rename/duplicate/archive/delete |
| JPG/PNG/WebP import | Yes | Yes | No | Project Blob | No | Yes | E2E pending | FUNCTIONAL | Picker/drop/clipboard/camera |
| RAW/HEIC/TIFF import | No | No | No | No | No | No | No | NOT STARTED | Decoder required |
| Canvas preview | Yes | Yes | No | Recipe | No | Yes | Unit/build | FUNCTIONAL | Shared with export pipeline |
| Zoom/pan/compare | Yes | Yes | No | View state | No | Yes | E2E pending | FUNCTIONAL | Pointer/wheel/original hold |
| Manual light/color | Yes | Yes | No | Recipe | No | Yes | Core/unit | FUNCTIONAL | Real pixel changes |
| Sharpness/denoise | Yes | Yes | No | Recipe | No | Yes | Unit | FUNCTIONAL | Bounded spatial kernels |
| Histogram | Yes | Yes | No | No | No | Yes | Build | FUNCTIONAL | Live RGB histogram |
| Composite tone curve | Yes | Yes | No | Recipe | No | Yes | Unit | FUNCTIONAL | Editable 3-point LUT |
| HSL mixer | Yes | Yes | No | Recipe | No | Yes | Unit | FUNCTIONAL | 8 color ranges, H/S/L |
| Crop/rotate/flip | Yes | Yes | No | Recipe | No | Yes | Unit | FUNCTIONAL | Reversible centered crop |
| Free crop/perspective | No | No | No | No | No | No | No | NOT STARTED | Planned |
| Undo/redo | Yes | Yes | No | LocalStorage | No | Yes | E2E pending | FUNCTIONAL | Bounded history |
| Snapshots | Yes | Yes | No | IndexedDB | No | Yes | E2E pending | FUNCTIONAL | Create/restore/rename/delete |
| Layers/masks | Status only | No | No | No | No | N/A | No | NOT STARTED | No fake layer processing |
| Built-in presets | Yes | Yes | No | Recipe | No | Yes | Unit | FUNCTIONAL | Five looks |
| Personal presets | Yes | Yes | No | IndexedDB | No | Yes | E2E pending | FUNCTIONAL | Save/search/CRUD/JSON import-export |
| AI prompt plan | Yes | Yes | Zod route | No | Local rules | Yes | Unit | MOCK | Explicitly DEMO, no CV claim |
| Real AI scene analysis | Status only | No | No | No | No | Yes | No | NOT STARTED | Provider required |
| Batch processing | Yes | Yes | No | No | No | Yes | Build | PARTIAL | Real queue/export; no culling intelligence |
| Gallery | Yes | Yes | No | IndexedDB | No | Yes | E2E pending | FUNCTIONAL | Local asset management |
| Community/marketplace | Status only | No | No | No | No | Yes | No | NOT STARTED | No fake social/payment states |
| Export JPEG/PNG/WebP | Yes | Yes | No | Export history | No | Yes | E2E pending | FUNCTIONAL | Quality/resize/crop override |
| Instagram export preset | Yes | Yes | No | History | No | Yes | E2E pending | FUNCTIONAL | JPG, sRGB, 4:5, 1350 px |
| Metadata/watermark | Disclosure only | No | No | No | No | Yes | No | NOT STARTED | Explicitly labeled |
| PWA shell | Yes | Partial | Service worker | Cache | N/A | Yes | Build | PARTIAL | Offline sync incomplete |
| Supabase RLS | N/A | Client optional | SQL exists | Not applied | N/A | N/A | Not run | READY | Requires target project |
| Unit tests | N/A | Yes | API rules | No DB | Demo provider | N/A | 7/7 PASS | TESTED | Core logic |
| Browser E2E | N/A | Defined | Local dev | IndexedDB | Demo route | Chromium | Pending PR | TESTING | Release gate added |
| Vercel deployment | N/A | N/A | Ready | N/A | N/A | N/A | Build PASS | FUNCTIONAL | Protected deployment |
