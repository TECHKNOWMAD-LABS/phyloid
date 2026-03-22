# Phyloid

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 22](https://img.shields.io/badge/Node-22-339933.svg?logo=node.js)](https://nodejs.org)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python)](https://python.org)
[![Tests](https://img.shields.io/badge/tests-14%20passing-brightgreen.svg)](#testing)

Generate living, fitness-mapped 3D organisms from natural language. Type a prompt — watch a colony of animated icosahedral lifeforms materialize in your browser.

## Features

- **Natural language world generator** — Parse plain-English prompts into organism count, detail level, fitness profile, color, and scale without a model API call.
- **Engine adapter pattern** — Rendering is behind an `EngineAdapter` interface. Ships with Three.js r128; swap in Babylon.js, PlayCanvas, or a custom WebGPU renderer with one class.
- **Fitness-mapped geometry** — Per-vertex displacement and RGB coloring driven by fitness arrays. Profiles: `random`, `gradient`, `uniform`, `spiky`.
- **Community gallery** — Save and browse organisms via Supabase. Like favorites. Schema included.
- **Subscription tiers** — Explorer (free), Researcher ($12/mo), Laboratory ($49/mo) enforced client-side with Stripe checkout.
- **PWA** — Installable, offline-capable, auto-updates via Workbox service worker.

## Quick Start

```bash
git clone https://github.com/techknowmad/phyloid.git
cd phyloid
npm install
cp .env.example .env          # fill in optional Supabase + Stripe keys
npm run dev                   # http://localhost:5173
```

Open the app, type a prompt like `"20 spiky red creatures"`, and hit **Generate**.

```bash
npm test                      # run 14 Vitest tests
npm run build                 # TypeScript + Vite → dist/
npm run preview               # preview production build
```

## Environment Variables

All variables are optional for local development. Gallery and payments require the relevant keys.

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `VITE_STRIPE_PRICE_PRO` | Stripe Price ID — Researcher tier |
| `VITE_STRIPE_PRICE_ENTERPRISE` | Stripe Price ID — Laboratory tier |

## Architecture

```
src/
├── engine/           # EngineAdapter interface + Three.js r128 implementation
│   ├── types.ts      # PhyloidGenome, EngineAdapter, EngineObject types
│   └── three-adapter.ts  # Icosahedra, per-vertex fitness displacement, render loop
├── world/            # NL prompt → genome generation
│   └── nl-generator.ts   # parseWorldPrompt(), generateFitness(), generateWorld()
├── gallery/          # Supabase CRUD (save, list, like, getById) + SQL schema
├── payments/         # TIERS array, tier enforcement, lazy Stripe checkout
├── ui/               # PhyloidApp shell — orchestrates engine, world, payments, DOM
├── main.ts           # Bootstrap entry point
└── index.html        # HTML + embedded dark-theme glassmorphism CSS
```

**Data flow:**

1. User submits prompt → `PhyloidApp.generateFromPrompt()`
2. `parseWorldPrompt()` extracts intent (count, detail, fitness profile, color, scale)
3. `generateWorld()` produces N `PhyloidGenome` objects
4. Tier limits applied (max organisms, max detail, max gallery uploads)
5. Each genome → `engine.createPhyloid()` → `IcosahedronGeometry` added to scene
6. `requestAnimationFrame` loop rotates meshes and drives vertex updates

**Fitness profiles:** `random` · `gradient` · `uniform` · `spiky`

**Tier limits:**

| Tier | Organisms | Max detail | Gallery uploads/mo |
|------|-----------|------------|--------------------|
| Explorer (free) | 5 | 2 | 3 |
| Researcher ($12/mo) | 50 | 4 | 50 |
| Laboratory ($49/mo) | 500 | 5 | Unlimited |

## Supabase Setup

Run the SQL at the bottom of `src/gallery/supabase-gallery.ts` to create the `phyloid_gallery` table and `increment_likes` RPC function.

## Testing

```bash
npm test              # Vitest, jsdom environment
npm run test:watch    # watch mode
```

14 tests across three suites: `engine-types`, `nl-generator`, `stripe-tiers`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions, commit style, and the PR checklist.

## License

MIT — see [LICENSE](LICENSE).

---

Built by [TechKnowMad Labs](https://techknowmad.ai)
