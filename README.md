# Phyloid

**What the Phyloid?** Phyloid is a 3D web app that generates living, fitness-mapped organisms from natural language. Type "a swarm of spiky green creatures" and watch a colony of glowing icosahedral lifeforms materialize in your browser.

Each organism is a Three.js `IcosahedronGeometry` whose vertices are displaced and colored by fitness values — high fitness pushes vertices outward and shifts them cyan/green, low fitness pulls inward and shifts red. The result: organic, alien shapes that look like they evolved.

## Features

- **NL World Generator** — Describe organisms in plain English. The parser extracts count, detail level, color, scale, and fitness profile from your prompt.
- **Engine Adapter Pattern** — Rendering is abstracted behind an `EngineAdapter` interface. Ships with Three.js r128; swap in Babylon, PlayCanvas, or a custom WebGPU renderer.
- **Fitness-Mapped Geometry** — Per-vertex displacement and coloring driven by fitness arrays. Supports random, gradient, uniform, and spiky profiles.
- **Supabase Gallery** — Save and browse community-created organisms. Like your favorites.
- **Stripe Payment Tiers** — Explorer (free), Researcher ($12/mo), Laboratory ($49/mo) with organism count, detail, and upload limits.
- **PWA** — Installable, works offline, auto-updates via Workbox service worker.
- **Cloudflare Pages CI** — GitHub Actions runs tests and deploys on push to main.

## Quick Start

```bash
npm install
npm run dev        # Vite dev server at localhost:5173
npm test           # Run 14 tests
npm run build      # Production build to dist/
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | For gallery | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For gallery | Supabase anonymous key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe publishable key |
| `VITE_STRIPE_PRICE_PRO` | For payments | Stripe Price ID for Pro tier |
| `VITE_STRIPE_PRICE_ENTERPRISE` | For payments | Stripe Price ID for Enterprise tier |

## Architecture

```
src/
  engine/          # EngineAdapter interface + Three.js implementation
  world/           # NL prompt parser → PhyloidGenome[] generator
  gallery/         # Supabase CRUD for community gallery
  payments/        # Stripe tier definitions and checkout
  ui/              # App shell and DOM UI
  main.ts          # Entry point
```

## Supabase Setup

Run the SQL in `src/gallery/supabase-gallery.ts` (bottom of file) to create the `phyloid_gallery` table and `increment_likes` RPC function.

## License

MIT
