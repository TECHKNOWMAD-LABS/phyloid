/**
 * Error hardening tests — Cycle 2
 * Tests null/undefined/empty inputs, malformed data, huge strings, unicode,
 * and other edge cases across all modules.
 */
import { describe, it, expect, vi } from "vitest";
import { clampFitness, defaultGenome, validateGenome, createGenomeId } from "../src/engine/types";
import {
  parseWorldPrompt,
  generateFitness,
  generateWorld,
  icosahedronVertexCount,
} from "../src/world/nl-generator";
import { getTierById, canCreateOrganism, canUseDetail, canUploadToGallery } from "../src/payments/stripe-tiers";

// ---- engine/types hardening -----------------------------------------------

describe("error-hardening: engine/types", () => {
  // Test 54
  it("clampFitness handles NaN → 0.5", () => {
    expect(clampFitness(NaN)).toBe(0.5);
  });

  // Test 55
  it("clampFitness handles Infinity → 0.5", () => {
    expect(clampFitness(Infinity)).toBe(0.5);
    expect(clampFitness(-Infinity)).toBe(0.5);
  });

  // Test 56
  it("clampFitness handles very large positive number → 1", () => {
    expect(clampFitness(1e100)).toBe(1);
  });

  // Note: clampFitness(1e100) - after isFinite/isNaN check 1e100 is finite and >1 → 1
  // (covered above)

  // Test 57
  it("validateGenome throws on non-object input", () => {
    expect(() => validateGenome(null as unknown as object)).toThrow(TypeError);
    expect(() => validateGenome("bad" as unknown as object)).toThrow(TypeError);
  });

  // Test 58
  it("validateGenome throws on detail out of range", () => {
    expect(() => validateGenome({ detail: -1 })).toThrow(RangeError);
    expect(() => validateGenome({ detail: 6 })).toThrow(RangeError);
    expect(() => validateGenome({ detail: 100 })).toThrow(RangeError);
  });

  // Test 59
  it("validateGenome throws on non-positive scale", () => {
    expect(() => validateGenome({ scale: 0 })).toThrow(RangeError);
    expect(() => validateGenome({ scale: -1 })).toThrow(RangeError);
    expect(() => validateGenome({ scale: Infinity })).toThrow(RangeError);
  });

  // Test 60
  it("validateGenome throws on bad color", () => {
    expect(() => validateGenome({ color: [1, 2] as unknown as [number, number, number] })).toThrow(TypeError);
    expect(() => validateGenome({ color: "red" as unknown as [number, number, number] })).toThrow(TypeError);
  });

  // Test 61
  it("validateGenome passes on valid partial overrides", () => {
    expect(() => validateGenome({ detail: 0 })).not.toThrow();
    expect(() => validateGenome({ detail: 5, scale: 2, color: [0.1, 0.2, 0.3] })).not.toThrow();
  });

  // Test 62
  it("defaultGenome throws on out-of-range detail override", () => {
    expect(() => defaultGenome({ detail: 10 })).toThrow(RangeError);
  });

  // Test 63
  it("defaultGenome with no overrides is always valid", () => {
    for (let i = 0; i < 10; i++) {
      const g = defaultGenome();
      expect(g.id).toMatch(/^phy_/);
      expect(g.scale).toBeGreaterThan(0);
      expect(g.detail).toBeGreaterThanOrEqual(0);
      expect(g.detail).toBeLessThanOrEqual(5);
    }
  });

  // Test 64
  it("createGenomeId always starts with phy_ and is unique", () => {
    const ids = Array.from({ length: 100 }, createGenomeId);
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
    ids.forEach((id) => expect(id).toMatch(/^phy_/));
  });
});

// ---- world/nl-generator hardening -----------------------------------------

describe("error-hardening: world/nl-generator", () => {
  // Test 65
  it("parseWorldPrompt with empty string returns defaults", () => {
    const intent = parseWorldPrompt("");
    expect(intent.organisms).toBe(1);
    expect(intent.detail).toBe(2);
    expect(intent.scale).toBe(1);
  });

  // Test 66
  it("parseWorldPrompt with null-like input (coerced) returns defaults", () => {
    // TypeScript won't allow null directly, simulate runtime bad input
    const intent = parseWorldPrompt(null as unknown as string);
    expect(intent.organisms).toBeGreaterThanOrEqual(1);
  });

  // Test 67
  it("parseWorldPrompt with very long string does not hang", () => {
    const longPrompt = "red organism ".repeat(500); // >2048 chars
    const start = Date.now();
    const intent = parseWorldPrompt(longPrompt);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500); // must complete in <500ms
    expect(intent).toBeDefined();
  });

  // Test 68
  it("parseWorldPrompt with unicode control chars sanitizes correctly", () => {
    const uglyPrompt = "3\u0000blue\u001Fcreatures";
    const intent = parseWorldPrompt(uglyPrompt);
    expect(intent.organisms).toBeGreaterThanOrEqual(1);
    // Should not throw
  });

  // Test 69
  it("parseWorldPrompt with emoji in prompt does not throw", () => {
    expect(() => parseWorldPrompt("🐙 purple swarm 🌊")).not.toThrow();
  });

  // Test 70
  it("parseWorldPrompt caps organism count at 50", () => {
    const intent = parseWorldPrompt("1000 organisms");
    expect(intent.organisms).toBeLessThanOrEqual(50);
  });

  // Test 71
  it("generateFitness with zero vertexCount returns empty array", () => {
    expect(generateFitness(0, "random")).toEqual([]);
  });

  // Test 72
  it("generateFitness with negative vertexCount returns empty array", () => {
    expect(generateFitness(-5, "uniform")).toEqual([]);
  });

  // Test 73
  it("generateFitness with Infinity returns empty array", () => {
    expect(generateFitness(Infinity, "gradient")).toEqual([]);
  });

  // Test 74
  it("generateFitness caps at 100,000 vertices", () => {
    const result = generateFitness(200_000, "uniform");
    expect(result.length).toBeLessThanOrEqual(100_000);
  });

  // Test 75
  it("icosahedronVertexCount clamps detail below 0", () => {
    expect(icosahedronVertexCount(-1)).toBe(icosahedronVertexCount(0));
  });

  // Test 76
  it("icosahedronVertexCount clamps detail above 5", () => {
    expect(icosahedronVertexCount(10)).toBe(icosahedronVertexCount(5));
    expect(icosahedronVertexCount(100)).toBe(icosahedronVertexCount(5));
  });

  // Test 77
  it("generateWorld with empty prompt returns at least one genome", () => {
    const genomes = generateWorld("");
    expect(Array.isArray(genomes)).toBe(true);
    expect(genomes.length).toBeGreaterThanOrEqual(1);
  });

  // Test 78
  it("generateWorld all genomes have valid color arrays", () => {
    const genomes = generateWorld("5 random organisms");
    genomes.forEach((g) => {
      expect(g.color).toHaveLength(3);
      g.color.forEach((c) => {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      });
    });
  });
});

// ---- payments/stripe-tiers hardening ----------------------------------------

describe("error-hardening: payments/stripe-tiers", () => {
  // Test 79
  it("getTierById returns undefined for unknown id", () => {
    expect(getTierById("")).toBeUndefined();
    expect(getTierById("unknown_tier")).toBeUndefined();
  });

  // Test 80
  it("canCreateOrganism handles negative currentCount gracefully", () => {
    const free = getTierById("free")!;
    expect(canCreateOrganism(free, -1)).toBe(true); // -1 < maxOrganisms
  });

  // Test 81
  it("canUseDetail handles negative detail gracefully", () => {
    const free = getTierById("free")!;
    expect(canUseDetail(free, -1)).toBe(true); // -1 <= maxDetail
  });

  // Test 82
  it("canUploadToGallery with negative uploadsThisMonth is true", () => {
    const free = getTierById("free")!;
    expect(canUploadToGallery(free, -5)).toBe(true);
  });

  // Test 83
  it("canUploadToGallery unlimited works for enterprise at large count", () => {
    const enterprise = getTierById("enterprise")!;
    expect(canUploadToGallery(enterprise, Number.MAX_SAFE_INTEGER)).toBe(true);
  });
});
