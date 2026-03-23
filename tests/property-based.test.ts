/**
 * Property-based tests — Cycle 6
 * Uses fast-check to verify invariants hold across random inputs.
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { clampFitness, createGenomeId, defaultGenome } from "../src/engine/types";
import {
  parseWorldPrompt,
  generateFitness,
  generateWorld,
  icosahedronVertexCount,
} from "../src/world/nl-generator";
import {
  getTierById,
  canCreateOrganism,
  canUseDetail,
  canUploadToGallery,
  TIERS,
} from "../src/payments/stripe-tiers";

// ---- engine/types properties -----------------------------------------------

describe("property-based: engine/types", () => {
  // Test 84
  it("clampFitness output always in [0, 1] for any finite number", () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true }), (v) => {
        const result = clampFitness(v);
        return result >= 0 && result <= 1 && isFinite(result);
      }),
    );
  });

  // Test 85
  it("clampFitness is idempotent: clamp(clamp(x)) === clamp(x)", () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true }), (v) => {
        const once = clampFitness(v);
        const twice = clampFitness(once);
        return Math.abs(once - twice) < 1e-15;
      }),
    );
  });

  // Test 86
  it("createGenomeId always matches /^phy_/ pattern", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), () => {
        return /^phy_/.test(createGenomeId());
      }),
      { numRuns: 50 },
    );
  });

  // Test 87
  it("defaultGenome with valid detail always has 0 ≤ detail ≤ 5", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (detail) => {
        const g = defaultGenome({ detail });
        return g.detail === detail;
      }),
    );
  });

  // Test 88
  it("defaultGenome with valid scale always has scale > 0", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        (scale) => {
          const g = defaultGenome({ scale });
          return g.scale > 0 && isFinite(g.scale);
        },
      ),
    );
  });
});

// ---- world/nl-generator properties -----------------------------------------

describe("property-based: world/nl-generator", () => {
  // Test 89
  it("parseWorldPrompt never throws on any printable ASCII string", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        // Replace control chars to avoid triggering sanitizer side effects
        const safe = s.replace(/[\x00-\x1f\x7f]/g, "");
        expect(() => parseWorldPrompt(safe)).not.toThrow();
        return true;
      }),
      { numRuns: 200 },
    );
  });

  // Test 90
  it("parseWorldPrompt organisms always in [1, 50]", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const intent = parseWorldPrompt(s);
        return intent.organisms >= 1 && intent.organisms <= 50;
      }),
      { numRuns: 200 },
    );
  });

  // Test 91
  it("parseWorldPrompt detail always in [1, 5]", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const intent = parseWorldPrompt(s);
        return intent.detail >= 1 && intent.detail <= 5;
      }),
      { numRuns: 200 },
    );
  });

  // Test 92
  it("parseWorldPrompt scale always > 0", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const intent = parseWorldPrompt(s);
        return intent.scale > 0 && isFinite(intent.scale);
      }),
      { numRuns: 200 },
    );
  });

  // Test 93
  it("generateFitness values always in [0, 1] for any valid count and profile", () => {
    const profiles = ["random", "gradient", "uniform", "spiky"] as const;
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.constantFrom(...profiles),
        (count, profile) => {
          const fitness = generateFitness(count, profile);
          return (
            fitness.length === count &&
            fitness.every((v) => v >= 0 && v <= 1 && isFinite(v))
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  // Test 94
  it("generateFitness gradient is monotonically non-decreasing", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 500 }), (count) => {
        const fitness = generateFitness(count, "gradient");
        for (let i = 1; i < fitness.length; i++) {
          if (fitness[i] < fitness[i - 1] - 1e-10) return false;
        }
        return true;
      }),
      { numRuns: 50 },
    );
  });

  // Test 95
  it("generateFitness uniform always exactly 0.7", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (count) => {
        const fitness = generateFitness(count, "uniform");
        return fitness.every((v) => v === 0.7);
      }),
      { numRuns: 50 },
    );
  });

  // Test 96
  it("icosahedronVertexCount always returns positive multiple of 60", () => {
    fc.assert(
      fc.property(fc.integer({ min: -10, max: 20 }), (detail) => {
        const count = icosahedronVertexCount(detail);
        return count > 0 && count % 60 === 0;
      }),
    );
  });

  // Test 97
  it("generateWorld never throws on random string prompts", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(() => generateWorld(s)).not.toThrow();
        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Test 98
  it("generateWorld returns array of 1-50 genomes for any prompt", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const genomes = generateWorld(s);
        return (
          Array.isArray(genomes) &&
          genomes.length >= 1 &&
          genomes.length <= 50
        );
      }),
      { numRuns: 100 },
    );
  });

  // Test 99
  it("generateWorld genomes always have valid color channels in [0, 1]", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const genomes = generateWorld(s);
        return genomes.every((g) =>
          g.color.length === 3 &&
          g.color.every((c) => c >= 0 && c <= 1 && isFinite(c)),
        );
      }),
      { numRuns: 50 },
    );
  });
});

// ---- payments/stripe-tiers properties --------------------------------------

describe("property-based: payments/stripe-tiers", () => {
  // Test 100
  it("canCreateOrganism is true when count < maxOrganisms (monotone)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TIERS),
        fc.integer({ min: 0, max: 1000 }),
        (tier, count) => {
          const allowed = canCreateOrganism(tier, count);
          return allowed === (count < tier.maxOrganisms);
        },
      ),
    );
  });

  // Test 101
  it("canUseDetail is true when detail ≤ maxDetail (monotone)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TIERS),
        fc.integer({ min: 0, max: 10 }),
        (tier, detail) => {
          return canUseDetail(tier, detail) === (detail <= tier.maxDetail);
        },
      ),
    );
  });

  // Test 102
  it("canUploadToGallery enterprise always returns true", () => {
    const enterprise = getTierById("enterprise")!;
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (count) => {
        return canUploadToGallery(enterprise, count) === true;
      }),
      { numRuns: 50 },
    );
  });
});
