# LumaForge AI Studio

A dark-first, non-destructive browser photo editor built with Next.js 16, React 19 and TypeScript.

## Functional in this repository

- JPG/PNG/WebP import with validation and decode errors
- Real Canvas pixel processing for light, color, detail, vignette and grain
- Zoom, pan and press-to-compare original
- Undo/redo with persisted adjustment history
- Five functional presets
- Transparent local rule-based edit plans, clearly labeled as DEMO rather than cloud AI
- JPEG/PNG browser export from the rendered result
- Responsive desktop/tablet/mobile shell
- Zod-validated API route
- Initial Supabase schema and RLS migration (not applied)
- Unit and Playwright test definitions
- GitHub Actions validation workflow

## Honest limitations

RAW decoding, masks, layers, beauty segmentation, generative AI, batch processing, authentication, cloud persistence, collaboration, marketplace payments and production deployment are not complete. Status pages describe these gaps rather than presenting fake functionality.

## Run

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The current execution environment could not access the npm registry, so dependency installation and the full Next.js validation suite must run through GitHub Actions or a network-enabled workstation.
