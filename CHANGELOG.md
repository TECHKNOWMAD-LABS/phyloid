# Changelog

All notable changes to Phyloid are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.0] — 2026-03-23

Initial release — 8 Edgecraft autonomous iteration cycles.

### Added

#### Cycle 1 — Test Coverage
- `tests/three-adapter.test.ts`: 12 unit tests for `ThreeAdapter` — mocks Three.js Scene/Camera/Renderer
- `tests/phyloid-app.test.ts`: 12 integration tests for `PhyloidApp` — mocks EngineAdapter, tests UI interaction
- `tests/supabase-gallery.test.ts`: 11 unit tests for `SupabaseGallery` — mocks Supabase client
- `tests/checkout.test.ts`: 4 unit tests for `redirectToCheckout` — mocks @stripe/stripe-js
- @stripe/stripe-js added as dev dependency for Vite module resolution in tests
- Test count grew from 14 → 53

#### Cycle 2 — Error Hardening
- `src/engine/types.ts`: `clampFitness` now returns 0.5 for NaN/Infinity; `validateGenome()` validates detail (0-5), scale (>0 finite), color (3-element array); `defaultGenome` validates overrides
- `src/world/nl-generator.ts`: `parseWorldPrompt` sanitizes null/undefined/non-string/over-long (>2048 char)/unicode-control inputs; `generateFitness` guards ≤0 and Infinity → []; caps at 100k vertices; `icosahedronVertexCount` clamps detail to 0-5
- `src/ui/app.ts`: `setTier` validates against known tier IDs; `generateFromPrompt` guards non-string prompt
- `tests/error-hardening.test.ts`: 30 new edge-case tests
- Test count grew from 53 → 83

#### Cycle 3 — Performance
- `nl-generator.ts`: `_VERTEX_COUNT_CACHE` memoizes 6 icosahedron vertex counts (eliminates Math.pow calls)
- `nl-generator.ts`: `generateFitness` uses `new Array(count)` pre-allocation + `Array.fill` for uniform profile
- `nl-generator.ts`: `parseWorldPrompt` single-pass token loop (was 3 separate O(n) iterations)
- `nl-generator.ts`: `generateWorld` shares deterministic fitness arrays (uniform/gradient/spiky) across organisms; only random profile generates per-organism

#### Cycle 4 — Security
- `.gitignore`: created (was missing) — excludes `.env*`, `dist/`, `node_modules/`, `coverage/`, OS artifacts
- `src/index.html`: Content-Security-Policy `<meta>` header (restricts scripts, styles, connect-src to self + Supabase)
- `scripts/security-scan.mjs`: custom scanner for 8 secret/injection patterns with false-positive allowlist; exits 1 on any real finding
- Scan result: 0 findings, 0 false positives, 14 files clean

#### Cycle 5 — CI/CD
- `.github/workflows/ci.yml`: restructured into 4 jobs — `lint`, `test`, `security`, `build-and-deploy`; build gated on all three quality jobs passing
- `eslint.config.js`: ESLint v10 flat config with typescript-eslint/recommended, `no-eval`, `no-implied-eval`, `prefer-const`
- `package.json`: added `lint`, `lint:fix`, `security`, `format`, `clean` scripts
- Fixed 2 ESLint warnings (unused vars prefixed with `_`) and 1 error (no-control-regex suppressed with comment)

#### Cycle 6 — Property-Based Testing
- `tests/property-based.test.ts`: 19 fast-check property tests
  - `clampFitness` idempotent; output always [0,1] for any finite double
  - `parseWorldPrompt` never throws; organisms [1,50]; detail [1,5]; scale >0
  - `generateFitness` uniform always 0.7; gradient monotonically non-decreasing; values [0,1]
  - `icosahedronVertexCount` always positive multiple of 60
  - `generateWorld` never throws; returns 1-50 genomes; all color channels [0,1]
  - TIERS access-control functions are all monotone (no off-by-one bugs)
- fast-check installed as dev dependency
- Test count grew from 83 → 102

#### Cycle 7 — Examples + Docs
- `examples/basic-world.html`: NL prompt → 3D organism generation, no build step, Three.js CDN
- `examples/fitness-animation.html`: 3 organisms with sinusoidal real-time per-vertex fitness animation
- `examples/tier-comparison.html`: side-by-side Free/Researcher/Laboratory tier organism visualization
- `README.md`: complete API reference, examples table, test suite breakdown, security section, fitness profiles table
- JSDoc added to all public functions in `src/payments/stripe-tiers.ts`

#### Cycle 8 — Release Engineering
- `package.json`: version bumped 1.0.0 → 0.1.0; added `author`, `homepage`, `repository`, `bugs`
- `CHANGELOG.md`: this file
- `Makefile`: `test`, `lint`, `security`, `clean`, `build`, `format` targets
- `AGENTS.md`: documents the 8-cycle Edgecraft autonomous development protocol
- `EVOLUTION.md`: timestamps and findings for all 8 cycles
- Git tag: `v0.1.0`

### Fixed
- `src/ui/app.ts`: removed unused `x`/`z` variables from circle-spread loop (lint)
- `src/world/nl-generator.ts`: gradient `t` variable used `vertexCount` instead of `count` (was pre-cap value)

### Security
- No hardcoded secrets found in any source file
- All credentials use `import.meta.env` (VITE_* pattern)
- CSP header added to production HTML
- `.gitignore` prevents accidental `.env` commits

---

[0.1.0]: https://github.com/TECHKNOWMAD-LABS/phyloid/releases/tag/v0.1.0
