# Studio experience upgrade

## Delivered

- New responsive home workspace with animated light artwork, workflow cards, and recent local projects.
- Unified blue glass surfaces and motion preferences across the existing editor, projects, presets, batch, export, and cloud shell.
- Searchable keyboard-accessible navigation (Ctrl/Cmd K) and an all-menus dialog on mobile. Native dialog supplies focus containment, Escape dismissal, and focus restoration.
- Working AI Studio and Beauty Studio launchers open the appropriate tools in the shared editor. The legacy `/batch-edit` URL redirects to the actual batch processor.
- Persistent settings: reduced motion, a 1000px performance preview, and autosave for previously saved projects. Export resolution remains independently selected.
- Local pixel analysis measures original-image luminance, dark pixels, and bright pixels, then offers a bounded, undoable global correction. Transparent pixels are excluded.
- Prompt rules now run locally without artificial progress delays or an unnecessary network request. Removed unmeasured quality scores, confidence percentages, and fictitious storage/credit usage from the updated assistant and shell.
- Repaired grid comparison rendering when switching modes, keyboard-accessible comparison handle, correct handle coordinates within the transformed image, decode caching, render error feedback, and pointer cancellation.
- Preserve native text-field Undo while keeping editor shortcuts for adjustment sliders.
- Use system fonts for Thai/Latin support without build-time Google Fonts requests. Commit a dependency lockfile for reproducible installs.

## Validation

- `npm run build`: lint, TypeScript, all 17 unit tests, and production build passed.
- Added dark/bright/transparent-pixel unit cases.
- Added Playwright coverage for mobile/desktop menu discovery, persisted settings, measured correction, rendered four-canvas comparison, and the legacy batch redirect. Existing mobile text assertion updated.
- Browser verification was attempted but could not complete locally: agent-browser daemon could not start; downloading Chromium timed out. Playwright tests have not been confirmed passing locally. GitHub CI runs these tests before merge.

## Boundaries

This is a functional local studio upgrade, not a connected generative AI backend. Face segmentation, object removal, generative fill, paid AI credits, and marketplace checkout remain unavailable. Existing cloud configuration and migrations are unchanged; live authentication, sync, and owner isolation were not tested in this environment. No production deployment or main-branch merge was performed.
