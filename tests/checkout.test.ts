/**
 * Tests for src/payments/checkout.ts — redirectToCheckout
 *
 * The function uses a dynamic import of "@stripe/stripe-js" which is not
 * bundled at test time. We test:
 *  1. The key-missing guard (throws before any dynamic import)
 *  2. The missing-price-id guard (throws before any dynamic import)
 *
 * For the Stripe loading paths we mock the module via vi.mock so Vite
 * resolves the import at transform time.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Provide a stub for @stripe/stripe-js so Vite can resolve it
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(),
}));

describe("payments/checkout — redirectToCheckout", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // Test 50
  it("throws when Stripe publishable key is not set", async () => {
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "");
    const { redirectToCheckout } = await import("../src/payments/checkout");
    await expect(redirectToCheckout("pro")).rejects.toThrow(
      "Stripe publishable key not configured"
    );
  });

  // Test 51
  it("throws for tier with no configured price ID", async () => {
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_abc");
    vi.stubEnv("VITE_STRIPE_PRICE_PRO", "");
    vi.stubEnv("VITE_STRIPE_PRICE_ENTERPRISE", "");
    const { redirectToCheckout } = await import("../src/payments/checkout");
    // 'free' tier has no Stripe price → should throw
    await expect(redirectToCheckout("free")).rejects.toThrow(
      "No Stripe price configured for tier: free"
    );
  });

  // Test 52
  it("throws when Stripe SDK returns null (load failure)", async () => {
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_abc");
    vi.stubEnv("VITE_STRIPE_PRICE_PRO", "price_pro_123");

    const { loadStripe } = await import("@stripe/stripe-js");
    (loadStripe as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { redirectToCheckout } = await import("../src/payments/checkout");
    await expect(redirectToCheckout("pro")).rejects.toThrow("Failed to load Stripe");
  });

  // Test 53
  it("throws when stripe.redirectToCheckout returns an error", async () => {
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_abc");
    vi.stubEnv("VITE_STRIPE_PRICE_ENTERPRISE", "price_ent_456");

    const { loadStripe } = await import("@stripe/stripe-js");
    (loadStripe as ReturnType<typeof vi.fn>).mockResolvedValue({
      redirectToCheckout: vi.fn().mockResolvedValue({ error: { message: "card declined" } }),
    });

    const { redirectToCheckout } = await import("../src/payments/checkout");
    await expect(redirectToCheckout("enterprise")).rejects.toThrow("card declined");
  });
});
