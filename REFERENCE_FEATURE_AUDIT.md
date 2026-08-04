# Reference Feature Integration Audit

Date: 2026-08-04
Purpose: prevent duplicate menus, routes, state engines and workflows while integrating the reference specification.

| Requested function | Existing equivalent | Action | Canonical owner | Result |
|---|---|---|---|---|
| Main navigation | AppShell flat navigation | Upgrade and group | AppShell | Primary/Library/Discover/Output/System groups |
| AI Assistant | AI Plan panel | Merge and upgrade | Editor left assistant | Scene context, prompt, suggestions, confidence |
| AI Chat / explanation | Prompt editor and API response | Merge | AI Assistant | One conversation surface |
| AI Director | No complete equivalent | Add | Right inspector | Analyze → Plan → Edit |
| Auto Enhance / Auto Fix | Presets and local plan rules | Merge and expand | AI Auto Enhance | Nine modes; no second auto tool |
| Selective Enhance | No equivalent | Add to Auto Enhance | AI Auto Enhance | Targets and protection locks |
| Reference Style Match | Personal presets | Upgrade and merge | Reverse Preset Generator | Internal preset, XMP, LUT and JSON |
| Color Match / Album Match | Batch/project recipes | Merge | Color Consistency | Current photo and album operations |
| Histogram | Existing histogram | Upgrade | Right inspector | One RGB/luminance component |
| Light controls | Existing AdjustmentPanel | Replace with shared primitives | Right inspector | One professional Light section |
| HSL | Existing ColorMixer | Preserve and embed | Right inspector | One eight-color mixer |
| Tone Curve | Existing ToneCurvePanel | Preserve and embed | Right inspector | One curve component |
| Crop/geometry | Existing GeometryPanel | Upgrade | Right inspector | Free crop, straighten and perspective approximation |
| Before/After | Hold-original preview | Upgrade | CanvasStage | One compare engine with multiple layouts |
| Undo/redo | Existing editor store | Preserve and expand | Editor store | Manual and AI share one history |
| Versions | Existing VersionPanel | Upgrade | Right inspector | Snapshot, duplicate and branch |
| Presets/Looks | Existing Presets route | Preserve; redirect `/looks` | `/presets` | One preset system |
| Batch/Batch Edit | Existing Batch route | Preserve; redirect `/batch` | `/batch-edit` | One batch system |
| Gallery/Library | Existing Gallery | Preserve; redirect `/library` | `/gallery` | Gallery owns assets |
| Projects/Recent Projects | Existing Projects | Preserve | `/projects` | Projects own editing work |
| Export/Exports | Existing Export Center | Preserve; redirect `/exports` | `/export-center` | One export system |
| AI/AI Studio | Existing status route | Canonicalize | `/ai-studio` | `/ai` redirects |
| Beauty/Beauty Studio | Existing status route | Canonicalize | `/beauty-studio` | `/beauty` redirects |
| Cloud status | Sidebar and status page | Consolidate | `/cloud` + account footer | One cloud status source |
| Filmstrip | No project filmstrip | Add | Editor bottom region | Current album/project context only |
| Collaboration | No complete equivalent | Move, do not add sidebar item | Projects/Share | Browser Share is partial |
| Notifications | No complete equivalent | Place | Top toolbar | Single notifications entry |
| Profile | Existing auth/profile | Move from desktop sidebar destination | Account menu/mobile profile | No duplicate main item |

## Duplication Check

- No duplicate sidebar destinations remain.
- Manual and AI edits use one editor store and one undo history.
- Preview, histogram, batch and export use the shared renderer.
- Presets, projects, gallery, batch and export retain one canonical system each.
- AI Assistant, Director and Auto Enhance have distinct responsibilities inside one inspector architecture.
- Old duplicate route names redirect instead of rendering parallel pages.
