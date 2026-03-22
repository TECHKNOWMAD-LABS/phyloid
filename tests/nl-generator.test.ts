import { describe, it, expect } from "vitest";
import {
  parseWorldPrompt,
  generateFitness,
  generateWorld,
  icosahedronVertexCount,
} from "../src/world/nl-generator";

describe("world/nl-generator", () => {
  // Test 4
  it("parseWorldPrompt extracts organism count from numeric phrases", () => {
    const intent = parseWorldPrompt("create 7 phyloid creatures");
    expect(intent.organisms).toBe(7);
  });

  // Test 5
  it("parseWorldPrompt recognizes swarm keyword", () => {
    const intent = parseWorldPrompt("a swarm of tiny organisms");
    expect(intent.organisms).toBe(12);
    expect(intent.scale).toBeCloseTo(0.4, 1);
  });

  // Test 6
  it("parseWorldPrompt detects color and fitness profile", () => {
    const intent = parseWorldPrompt("spiky green creatures");
    expect(intent.fitnessProfile).toBe("spiky");
    expect(intent.colorHint).toEqual([0.1, 0.9, 0.3]);
  });

  // Test 7
  it("parseWorldPrompt detects detail level keywords", () => {
    expect(parseWorldPrompt("intricate organisms").detail).toBe(4);
    expect(parseWorldPrompt("simple shapes").detail).toBe(1);
    expect(parseWorldPrompt("normal organisms").detail).toBe(2); // default
  });

  // Test 8
  it("generateFitness returns correct length for each profile", () => {
    for (const profile of ["random", "gradient", "uniform", "spiky"] as const) {
      const f = generateFitness(100, profile);
      expect(f).toHaveLength(100);
      f.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    }
  });

  // Test 9
  it("generateFitness gradient profile is monotonically increasing", () => {
    const f = generateFitness(50, "gradient");
    for (let i = 1; i < f.length; i++) {
      expect(f[i]).toBeGreaterThanOrEqual(f[i - 1]);
    }
  });

  // Test 10
  it("icosahedronVertexCount returns expected values", () => {
    expect(icosahedronVertexCount(0)).toBe(60);
    expect(icosahedronVertexCount(1)).toBe(240);
    expect(icosahedronVertexCount(2)).toBe(960);
  });

  // Test 11
  it("generateWorld produces genomes matching prompt", () => {
    const genomes = generateWorld("3 smooth blue creatures");
    expect(genomes).toHaveLength(3);
    genomes.forEach((g) => {
      expect(g.id).toMatch(/^phy_/);
      expect(g.detail).toBe(3); // smooth → 3
      expect(g.fitness.length).toBeGreaterThan(0);
    });
  });
});
