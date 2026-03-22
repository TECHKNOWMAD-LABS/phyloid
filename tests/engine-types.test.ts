import { describe, it, expect } from "vitest";
import { createGenomeId, clampFitness, defaultGenome } from "../src/engine/types";

describe("engine/types", () => {
  // Test 1
  it("createGenomeId returns unique prefixed IDs", () => {
    const a = createGenomeId();
    const b = createGenomeId();
    expect(a).toMatch(/^phy_/);
    expect(b).toMatch(/^phy_/);
    expect(a).not.toBe(b);
  });

  // Test 2
  it("clampFitness clamps values to [0,1]", () => {
    expect(clampFitness(-0.5)).toBe(0);
    expect(clampFitness(0.5)).toBe(0.5);
    expect(clampFitness(1.5)).toBe(1);
    expect(clampFitness(0)).toBe(0);
    expect(clampFitness(1)).toBe(1);
  });

  // Test 3
  it("defaultGenome produces valid genome with overrides", () => {
    const g = defaultGenome({ name: "TestOrg", detail: 3 });
    expect(g.name).toBe("TestOrg");
    expect(g.detail).toBe(3);
    expect(g.id).toMatch(/^phy_/);
    expect(g.scale).toBe(1);
    expect(g.color).toEqual([0.2, 0.8, 0.5]);
    expect(g.mutations).toBe(0);
    expect(g.fitness).toEqual([]);
  });
});
