# Phyloid

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/Node-20+-339933.svg?logo=node.js)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-102%20passing-brightgreen.svg)](#testing)
[![CI](https://github.com/TECHKNOWMAD-LABS/phyloid/actions/workflows/ci.yml/badge.svg)](https://github.com/TECHKNOWMAD-LABS/phyloid/actions)

Generate living, fitness-mapped 3D organisms from natural language. Type a prompt — watch a colony
of animated icosahedral lifeforms materialize in your browser.

```
"swarm of spiky green organisms" → 12 animated icosahedra with spiky fitness displacement
```

## Features

- **Natural language world generator** — Parse plain-English prompts into organism count, detail
  level, fitness profile, color, and scale — no external model API.
- **Engine adapter pattern** — Rendering behind an `EngineAdapter` interface. Ships with
  Three.js r128; swap in Babylon.js or any WebGPU renderer with one class.
- **Fitness-mapped geometry** — Per-vertex displacement and RGB coloring driven by fitness arrays.
  Profiles: `random`, `gradient`, `uniform`, `spiky`.
- **Input hardening** — All inputs validated: null/undefined, NaN/Infinity, strings >2048 chars,
  unicode control characters, and out-of-range values are handled gracefully.
- **Community gallery** — Save and browse organisms via Supabase. Like favorites. SQL schema included.
- **Subscription tiers** — Explorer (free), Researcher ($12/mo), Laboratory ($49/mo) enforced
  client-side; Stripe Checkout for upgrades.
- **PWA** — Installable, offline-capable, auto-updates via Workbox service worker.
- **102 tests** — Unit, integration, and property-based (fast-check) covering all public APIs.

## Quick Start

```bash
git clone https://github.com/TECHKNOWMAD-LABS/phyloid.git
cd phyloid
npm install --include=dev
cp .env.example .env          # fill in optional Supabase + Stripe keys
npm run dev                   # http://localhost:5173
```

Open the app, type a prompt like `"20 spiky red creatures"`, and hit **Generate**.

## Scripts

```bash
npm test              # run 102 Vitest tests (unit + property-based)
npm run test:watch    # interactive watch mode
npm run lint          # ESLint on src/
npm run lint:fix      # auto-fix lint issues
npm run security      # secret + injection scanner on src/
npm run build         # TypeScript + Vite → dist/
npm run preview       # preview production build
npm run clean         # remove dist/, coverage/
```

## Examples

Open these HTML files (no build step needed — uses Three.js CDN):

| File | What it shows |
|------|---------------|
| `examples/basic-world.html` | Type a prompt → generate 3D organisms in-browser |
| `examples/fitness-animation.html` | Sinusoidal real-time fitness vertex animation |
| `examples/tier-comparison.html` | Free/Pro/Enterprise organism limits side-by-side |

```bash
npx serve .    # serve the repo root
# Then open: http://localhost:3000/examples/basic-world.html
```

## API Reference

### `parseWorldPrompt(prompt: string): WorldIntent`

Parse a natural-language description into a structured `WorldIntent`.

```ts
const intent = parseWorldPrompt("swarm of spiky green organisms");
// { organisms: 12, detail: 2, fitnessProfile: "spiky", colorHint: [0.1,0.9,0.3], scale: 1 }
```

**Recognized keywords:**

| Category | Keywords |
|----------|---------|
| Count | `swarm`/`many`/`colony` → 12; `pair`/`two` → 2; `few`/`some` → 5; `N [type]s` → N (max 50) |
| Detail | `simple`/`basic` → 1; `smooth`/`detailed` → 3; `complex`/`intricate` → 4; `ultra`/`highres` → 5 |
| Fitness | `spiky`/`jagged`/`rough` → spiky; `gradient`/`flowing` → gradient; `uniform`/`flat` → uniform |
| Color | `red`, `green`, `blue`, `purple`, `cyan`, `orange`, `pink`, `yellow`, `white` |
| Scale | `tiny`/`small` → 0.4×; `large`/`big`/`huge` → 1.8×; `giant`/`massive` → 2.5× |

### `generateWorld(prompt: string): PhyloidGenome[]`

Generate an array of `PhyloidGenome` objects ready to pass to the engine adapter.

```ts
const genomes = generateWorld("3 smooth blue creatures");
// Array of 3 PhyloidGenomes with detail=3, blue color, gradient fitness
```

### `generateFitness(vertexCount: number, profile: FitnessProfile): number[]`

Generate per-vertex fitness values in `[0, 1]`.

```ts
const fitness = generateFitness(960, "spiky");
// [0.95, 0.2, 0.2, 0.95, 0.2, 0.2, ...] — alternating pattern
```

### `clampFitness(value: number): number`

Clamp a fitness value to `[0, 1]`. NaN and Infinity return `0.5`.

### `defaultGenome(overrides?: Partial<PhyloidGenome>): PhyloidGenome`

Create a genome with safe defaults. Validates overrides — throws `RangeError` for detail>5 or scale≤0.

### `ThreeAdapter` (implements `EngineAdapter`)

```ts
const adapter = new ThreeAdapter();
adapter.init(containerElement);

const genome = defaultGenome({ detail: 2, fitness: [0.5, 0.8, 0.3] });
const obj = adapter.createPhyloid(genome);  // returns EngineObject
adapter.updateFitness(genome.id, newFitnessArray);
adapter.render();  // call in requestAnimationFrame loop

const stats = adapter.getStats();  // { fps, drawCalls, triangles }
adapter.dispose();  // clean up all meshes + renderer
```

### `SupabaseGallery`

```ts
const gallery = new SupabaseGallery(supabaseUrl, anonKey);

// Save
const entry = await gallery.save({ genome, author: "alice", prompt: "green swarm" });

// Browse (paginated)
const entries = await gallery.list({ orderBy: "likes", limit: 10, offset: 0 });

// Like
await gallery.like(entry.id);

// Fetch single
const item = await gallery.getById(entry.id);
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
├── engine/
│   ├── types.ts            # PhyloidGenome, EngineAdapter, EngineObject, RenderStats
│   ├── three-adapter.ts    # Three.js r128 — icosahedra, fitness displacement, render loop
│   └── index.ts            # barrel export
├── world/
│   └── nl-generator.ts     # parseWorldPrompt(), generateFitness(), generateWorld()
├── gallery/
│   └── supabase-gallery.ts # SupabaseGallery — save/list/like/getById + SQL schema
├── payments/
│   ├── stripe-tiers.ts     # TIERS, getTierById, canCreate, canUseDetail, canUpload
│   └── checkout.ts         # redirectToCheckout() — lazy Stripe.js load
├── ui/
│   ├── app.ts              # PhyloidApp — orchestrates engine, world, tiers, DOM
│   └── index.ts            # barrel export
└── main.ts                 # Bootstrap entry point
```

**Data flow:**

1. User submits prompt → `PhyloidApp.generateFromPrompt(prompt)`
2. `parseWorldPrompt()` extracts intent (count, detail, fitness profile, color, scale)
3. `generateWorld()` produces N `PhyloidGenome` objects with fitness arrays
4. Tier limits applied (maxOrganisms, maxDetail)
5. Each genome → `engine.createPhyloid()` + `engine.updateFitness()` → adds mesh to Three.js scene
6. `requestAnimationFrame` loop calls `engine.render()` — meshes auto-rotate

**Fitness profiles:**

| Profile | Description |
|---------|-------------|
| `random` | Independent uniform random per vertex — unique per organism |
| `gradient` | Linear 0 → 1 across vertex index |
| `uniform` | All vertices 0.7 — deterministic, shared across organisms |
| `spiky` | Alternating 0.95 / 0.2 — every 3rd vertex at peak |

**Tier limits:**

| Tier | Organisms | Max detail | Gallery uploads/mo |
|------|-----------|------------|--------------------|
| Explorer (free) | 5 | 2 | 3 |
| Researcher ($12/mo) | 50 | 4 | 50 |
| Laboratory ($49/mo) | 500 | 5 | Unlimited |

## Testing

```bash
npm test              # 102 tests — unit + property-based (fast-check)
npm run test:watch    # watch mode
```

Test suites:

| Suite | Tests | Type |
|-------|-------|------|
| `engine-types.test.ts` | 3 | Unit |
| `three-adapter.test.ts` | 12 | Unit (Three.js mocked) |
| `nl-generator.test.ts` | 8 | Unit |
| `stripe-tiers.test.ts` | 3 | Unit |
| `checkout.test.ts` | 4 | Unit (Stripe mocked) |
| `supabase-gallery.test.ts` | 11 | Unit (Supabase mocked) |
| `phyloid-app.test.ts` | 12 | Integration (engine mocked) |
| `error-hardening.test.ts` | 30 | Edge cases |
| `property-based.test.ts` | 19 | fast-check properties |

## Security

- No secrets hardcoded — all credentials via `import.meta.env` (VITE_* variables)
- CSP `<meta>` header restricts scripts, styles, and connect-src
- `scripts/security-scan.mjs` — run `npm run security` to scan for 8 secret patterns
- `no-eval` and `no-implied-eval` ESLint rules enforced
- `.gitignore` excludes `.env*`, `dist/`, and OS artifacts

## Supabase Setup

Run the SQL at the bottom of `src/gallery/supabase-gallery.ts` to create the `phyloid_gallery`
table and the `increment_likes` RPC function.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions, commit style, and the PR checklist.

## License

MIT — see [LICENSE](LICENSE).

---

Built by [TechKnowMad Labs](https://techknowmad.ai)
