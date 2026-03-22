import { describe, it, expect } from "vitest";
import {
  TIERS,
  getTierById,
  canCreateOrganism,
  canUseDetail,
  canUploadToGallery,
} from "../src/payments/stripe-tiers";

describe("payments/stripe-tiers", () => {
  // Test 12
  it("TIERS has three tiers with correct IDs", () => {
    expect(TIERS).toHaveLength(3);
    expect(TIERS.map((t) => t.id)).toEqual(["free", "pro", "enterprise"]);
  });

  // Test 13
  it("tier enforcement functions respect limits", () => {
    const free = getTierById("free")!;
    expect(free).toBeDefined();
    expect(canCreateOrganism(free, 4)).toBe(true);
    expect(canCreateOrganism(free, 5)).toBe(false);
    expect(canUseDetail(free, 2)).toBe(true);
    expect(canUseDetail(free, 3)).toBe(false);
    expect(canUploadToGallery(free, 2)).toBe(true);
    expect(canUploadToGallery(free, 3)).toBe(false);
  });

  // Test 14
  it("enterprise tier allows unlimited gallery uploads", () => {
    const enterprise = getTierById("enterprise")!;
    expect(enterprise).toBeDefined();
    expect(canUploadToGallery(enterprise, 999999)).toBe(true);
    expect(canUseDetail(enterprise, 5)).toBe(true);
    expect(canCreateOrganism(enterprise, 499)).toBe(true);
  });
});
