# Architecture — LumaForge AI Studio

## Application Shell

- `AppShell` owns the canonical grouped navigation and responsive mobile navigation.
- `EditorWorkspace` owns the five-region editor grid and autosave orchestration.
- `AiAssistantPanel`, `CanvasStage`, `ProInspector` and `Filmstrip` are independent regions with shared domain state.
- Tablet and mobile presentation changes through CSS rails/drawers/bottom sheets; functionality is not duplicated.

## State Domains

### Editor Store

Single source of truth for:

- imported image reference
- adjustment recipe
- geometry
- viewport
- comparison preview state
- undo/redo history
- current project and preset

Manual sliders, presets, AI suggestions, AI Director, Auto Enhance, reference matching and color consistency all write to this store.

### Studio Store

UI/workflow state for:

- collapsible panels
- compare mode and position
- canvas overlays
- AI Auto Enhance mode/intensity
- selective targets and protection locks
- AI workflow progress/status
- active inspector section

## Processing Pipeline

1. Decode browser-supported image.
2. Calculate fixed or free crop.
3. Apply rotation, straighten, flip and perspective shear.
4. Apply exposure, recovery and dynamic-range controls.
5. Apply composite tone-curve LUT.
6. Apply white balance, global color and HSL mixer.
7. Apply shadow/midtone/highlight color grading.
8. Apply texture, clarity, dehaze, denoise and sharpening.
9. Apply grain and vignette.
10. Present preview or encode through the existing Export Center.

Original and edited comparison canvases use identical geometry. Preview, histogram, batch and export reuse the shared renderer.

## Persistence

- IndexedDB `projects`: original image Blob, recipe, geometry and lifecycle metadata.
- IndexedDB `versions`: snapshot/branch recipes linked to a project.
- IndexedDB `exports`: successful export history.
- IndexedDB `presets`: personal adjustment recipes.
- LocalStorage: panel preferences, copied settings and filmstrip ratings/labels/favorites/rejects.

## AI Boundary

- `/api/ai/plan` validates prompts and returns a local rule-based plan.
- Suggestion, Director and Auto Enhance recipes are deterministic and undoable.
- Reverse Preset and Color Consistency sample actual pixels locally at 64×64.
- Trained vision, segmentation, generation and identity models remain outside the current implementation and are labeled accordingly.

## Required Evolution

- Apply and test Supabase Auth, private Storage and owner RLS.
- Add Web Worker/OffscreenCanvas and tiled smart previews.
- Add projective perspective, masks and layer compositing.
- Add durable AI jobs, provider abstraction, audit logs, rate limits and credits.
- Add cloud conflict resolution, collaboration, marketplace entitlements and release monitoring.
