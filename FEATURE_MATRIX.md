# Feature Matrix — LumaForge AI Studio

Last updated: 2026-08-03 17:30 (Asia/Bangkok)
Evidence state: Historical code audit available; current source unavailable for revalidation.
Historical weighted completion estimate: 18%.

Legend:
- `Historical` means observed in the prior unavailable workspace.
- `Current` means reproducible in this session.
- No feature is marked COMPLETE because current source and tests are unavailable.

| Feature | UI | Frontend Logic | Backend | Database | AI Integration | Responsive | Tested | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Foundation and application shell | Historical Yes | Historical Partial | No evidence | No evidence | N/A | Historical Partial | Build/type only | PARTIAL | Next.js/React/TypeScript shell previously ran; current source unavailable |
| Design system | Historical Yes | Historical Partial | N/A | N/A | N/A | Historical Partial | No component tests | UI ONLY | Dark professional UI and shared controls existed historically |
| Landing/entry experience | Historical Partial | Historical Partial | No | No | Mock | Historical Partial | No E2E | MOCK | Requires route and CTA re-audit |
| Authentication and onboarding | Historical UI | Unverified | Unverified | Unverified | N/A | Historical Partial | No | UI ONLY | No verified protected-route/session flow |
| Dashboard and projects | Historical Yes | Mock | No | No | Mock | Historical Partial | No | MOCK | Demo projects/data; persistence not verified |
| Image import | Historical UI | Unverified | No | No | No | Historical Partial | No | UI ONLY | Real decoding, validation, metadata, retry, and persistence not proven |
| Core editor canvas | Historical Yes | Mock/Partial | No | No | No | Historical Partial | No | MOCK | Controls existed; real processing pipeline not verified |
| Manual adjustments | Historical Yes | Mock/Partial | No | No | N/A | Historical Partial | No | MOCK | Slider state existed; pixel output and persistence not proven |
| Color tools and curves | Historical Partial | Mock | No | No | No | Historical Partial | No | MOCK | Requires real color pipeline and tests |
| Crop and geometry | Historical Partial | Mock/Partial | No | No | No | Historical Partial | No | MOCK | Export compliance unverified |
| Masks and layers | Historical UI | Mock | No | No | Mock | Historical Partial | No | MOCK | No verified segmentation, mask persistence, or compositing |
| History and versions | Historical UI | Partial local state | No | No | N/A | Historical Partial | No | PARTIAL | Undo/redo UI existed; durable branching/version persistence unverified |
| Presets | Historical Yes | Mock/Partial | No | No | Mock | Historical Partial | No | MOCK | No verified import/export or persistence |
| AI provider abstraction | Historical UI only | Mock | No real adapter | No | Mock | Historical Partial | No | MOCK | No verified queue/provider/credit/audit implementation |
| AI analysis and prompt editing | Historical Yes | Mock | No | No | Mock | Historical Partial | No | MOCK | Results not backed by real image analysis |
| Beauty Studio | Historical Yes | Mock | No | No | Mock | Historical Partial | No | MOCK | Identity-preserving processing not verified |
| Generative tools | Historical UI | Mock | No | No | Mock | Historical Partial | No | MOCK | No real object removal/replace/expand provider |
| Batch editing and culling | Historical Yes | Mock | No | No | Mock | Historical Partial | No | MOCK | No real album processing, pause/resume, or outlier persistence |
| Gallery and asset management | Historical Yes | Mock | No | No | Mock | Historical Partial | No | MOCK | Demo assets; search/storage not verified |
| Community and marketplace | Historical Yes | Mock | No | No | N/A | Historical Partial | No | MOCK | No permissions, payments, entitlements, or persistence |
| Collaboration and client review | Historical UI/Unverified | Mock/Unverified | No | No | N/A | Historical Partial | No | UI ONLY | Realtime roles/comments/approval not verified |
| Export Center | Historical Yes | Mock | No real renderer | No history | No | Historical Partial | No | MOCK | No proof exported file matches preview |
| Mobile/tablet/PWA | Historical Partial | Partial | No sync | No offline DB evidence | N/A | Historical Partial | No device tests | PARTIAL | Responsive layouts existed; mobile-specific gestures/offline not proven |
| Security, privacy, accessibility | Historical Partial UI | Unverified | Unverified | RLS unverified | Consent unverified | Historical Partial | No audit | PARTIAL | Requires full server-side and WCAG review |
| Performance optimization | Unverified | Unverified | Unverified | Unverified | Unverified | Unverified | No profiling | NOT STARTED | No current source or benchmark evidence |
| Unit/integration/E2E tests | N/A | N/A | N/A | N/A | N/A | N/A | No suite | NOT STARTED | Historical project had no automated test suite |
| Repository bootstrap | Yes | N/A | N/A | N/A | N/A | N/A | Verified through GitHub | COMPLETE | Official repository initialized with README and control documents |
| Deployment and monitoring | N/A | N/A | N/A | N/A | N/A | N/A | No release validation | BLOCKED | No matching Vercel project or application source mapping found |

## Mock Inventory

Historical evidence indicates mock/demo behavior in at least:

- Dashboard metrics and projects
- Gallery assets and metadata
- Editor adjustments and processing outcomes
- AI analysis, prompt edits, and alternatives
- Beauty tools
- Batch/culling workflows
- Presets
- Marketplace and community
- Cloud sync/storage indicators
- Export jobs and results

The exact code locations must be reconstructed from the recovered source before replacement work begins.
