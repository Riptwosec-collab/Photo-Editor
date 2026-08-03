# Feature Matrix — LumaForge AI Studio

Last updated: 2026-08-03 17:55 (Asia/Bangkok)

| Feature | UI | Frontend Logic | Backend | Database | AI Integration | Responsive | Tested | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Foundation and shell | Yes | Yes | N/A | N/A | N/A | Yes | Partial | FUNCTIONAL | Full build pending CI |
| Image import JPG/PNG/WebP | Yes | Yes | No | No | No | Yes | Partial | FUNCTIONAL | Validation and decoding implemented |
| RAW/HEIC/TIFF import | No | No | No | No | No | No | No | NOT STARTED | Requires decoders |
| Core Canvas renderer | Yes | Yes | No | No | No | Yes | Core partial | FUNCTIONAL | Real per-pixel preview/export |
| Zoom and pan | Yes | Yes | No | No | No | Yes | No browser test | FUNCTIONAL | Pointer and wheel interaction |
| Before/original compare | Yes | Yes | No | No | No | Yes | No browser test | FUNCTIONAL | Hold button and shortcut |
| Manual light/color controls | Yes | Yes | No | Local recipe | No | Yes | Core partial | FUNCTIONAL | Real pixel changes |
| Detail controls | Yes | Partial | No | Local recipe | No | Yes | No | PARTIAL | Sharpness/denoise state-only |
| Undo/redo | Yes | Yes | No | LocalStorage | No | Yes | Logic inspected | FUNCTIONAL | Bounded history |
| Presets | Yes | Yes | No | LocalStorage | No | Yes | PASS core | FUNCTIONAL | Five presets |
| AI edit plan | Yes | Yes | API route | No | Local rules | Yes | PASS core | FUNCTIONAL | Explicit DEMO label |
| Real AI analysis | Status UI | No | No | No | No | Yes | No | NOT STARTED | Provider next |
| Export JPEG/PNG | Yes | Yes | No | No | No | Yes | No browser test | FUNCTIONAL | Canvas output |
| Supabase schema/RLS | N/A | N/A | Planned | SQL created | N/A | N/A | Not applied | READY | Core tables |
| Authentication | Status UI | No | No | No | N/A | Yes | No | NOT STARTED | No fake login |
| Beauty/Batch/Gallery | Status UI | No | No | No | No | Yes | No | PLANNED | No fake results |
| Community/Marketplace | Status UI | No | No | No | N/A | Yes | No | NOT STARTED | No fake feed/checkout |
| Mobile/tablet | Yes | Yes | N/A | N/A | N/A | Yes | E2E defined | PARTIAL | Device tests pending |
| PWA shell | Manifest/SW | Partial | No | Cache only | N/A | Yes | No | PARTIAL | Offline projects pending |
| Automated tests | N/A | Core + E2E definitions | API indirect | No DB tests | Demo tests | Mobile project | Core PASS | PARTIAL | Full suite pending |
| CI | N/A | Workflow | N/A | N/A | N/A | N/A | Not run | READY | GitHub Actions validates |
| Deployment | N/A | N/A | N/A | N/A | N/A | N/A | No | NOT STARTED | Vercel pending |
