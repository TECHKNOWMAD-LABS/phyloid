# AGENTS.md — Edgecraft Autonomous Development Protocol

This repository was autonomously improved by the **Edgecraft Protocol v4.0** — an 8-cycle
system for systematic quality elevation of software projects.

## Protocol Overview

Each cycle is an independent, focused pass over the codebase. Cycles are ordered by risk: safe
additions first (tests, docs) before destructive changes (refactors, security fixes).

| Cycle | Name | Focus |
|-------|------|-------|
| 1 | Test Coverage | Identify all untested modules; write comprehensive mocks and unit tests |
| 2 | Error Hardening | Try to break the code; add input validation and graceful error handling |
| 3 | Performance | Find sequential/redundant operations; add caching and pre-allocation |
| 4 | Security | Scan for hardcoded secrets and injection vectors; fix all real findings |
| 5 | CI/CD | Add lint, test, security, and build pipelines; configure ESLint |
| 6 | Property-Based Testing | Use fast-check to verify invariants across 100-200 random inputs |
| 7 | Examples + Docs | Create working examples; complete JSDoc; update README with API reference |
| 8 | Release Engineering | Bump version, CHANGELOG, Makefile, AGENTS.md, EVOLUTION.md; tag v0.1.0 |

## Commit Prefix Convention

All commits use an Edgecraft layer prefix:

| Prefix | Layer | Meaning |
|--------|-------|---------|
| `L0/attention:` | Attention | Something notable that needs awareness |
| `L1/detection:` | Detection | Identified a gap, bug, or untested area |
| `L2/noise:` | Noise | Scan result — N findings, M false positives |
| `L3/sub-noise:` | Sub-noise | Root-cause analysis of a subtle issue |
| `L4/conjecture:` | Conjecture | Hypothesis about a potential improvement |
| `L5/action:` | Action | Code change implementing an improvement |
| `L6/grounding:` | Grounding | Verified result (test count, coverage, measurement) |
| `L7/flywheel:` | Flywheel | Lesson applicable to other repos or systems |

## Agent Behavior

- **Never pauses to ask** — executes all 8 cycles autonomously start to finish
- **Fixes failures immediately** — if a test or lint check fails, fixes it before the next step
- **Pushes after every cycle** — each cycle ends with `git push origin main`
- **No empty commits** — every commit has a meaningful diff
- **Sequential with shared state** — later cycles build on earlier ones (tests catch hardening regressions)

## Files Created by Edgecraft

```
tests/three-adapter.test.ts        # Cycle 1 — Three.js adapter unit tests
tests/phyloid-app.test.ts          # Cycle 1 — PhyloidApp integration tests
tests/supabase-gallery.test.ts     # Cycle 1 — SupabaseGallery unit tests
tests/checkout.test.ts             # Cycle 1 — Stripe checkout unit tests
tests/error-hardening.test.ts      # Cycle 2 — Edge case tests (30 tests)
tests/property-based.test.ts       # Cycle 6 — fast-check property tests (19 tests)
.gitignore                         # Cycle 4 — was missing
scripts/security-scan.mjs          # Cycle 4 — custom secret scanner
eslint.config.js                   # Cycle 5 — ESLint flat config
.github/workflows/ci.yml           # Cycle 5 — 4-job CI pipeline (lint/test/security/deploy)
examples/basic-world.html          # Cycle 7 — NL prompt → organisms example
examples/fitness-animation.html    # Cycle 7 — real-time fitness animation example
examples/tier-comparison.html      # Cycle 7 — tier limit visualization
CHANGELOG.md                       # Cycle 8 — all changes documented
Makefile                           # Cycle 8 — convenience targets
AGENTS.md                          # Cycle 8 — this file
EVOLUTION.md                       # Cycle 8 — cycle-by-cycle findings log
```

## Files Modified by Edgecraft

```
src/engine/types.ts                # Cycles 2,3 — validation, clampFitness NaN guard
src/world/nl-generator.ts          # Cycles 2,3,5 — hardening, perf, lint fix
src/ui/app.ts                      # Cycles 2,5 — input validation, lint fix
src/payments/stripe-tiers.ts       # Cycle 7 — JSDoc
src/index.html                     # Cycle 4 — CSP header
package.json                       # Cycles 1,3,5,6,8 — deps, scripts, metadata
.github/workflows/ci.yml           # Cycle 5 — full replacement with 4-job structure
README.md                          # Cycle 7 — complete rewrite with API reference
```
