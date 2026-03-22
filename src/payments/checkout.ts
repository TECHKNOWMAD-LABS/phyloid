/**
 * Stripe Checkout redirect — separated to avoid bundling @stripe/stripe-js
 * in tests or for free-tier users.
 */
export async function redirectToCheckout(tierId: string): Promise<void> {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Stripe publishable key not configured. Set VITE_STRIPE_PUBLISHABLE_KEY.");
  }

  const priceMap: Record<string, string> = {
    pro: import.meta.env.VITE_STRIPE_PRICE_PRO ?? "",
    enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE ?? "",
  };

  const priceId = priceMap[tierId];
  if (!priceId) {
    throw new Error(`No Stripe price configured for tier: ${tierId}`);
  }

  // @ts-expect-error — @stripe/stripe-js loaded dynamically at runtime only
  const { loadStripe } = await import(/* @vite-ignore */ "@stripe/stripe-js");
  const stripe = await loadStripe(key);
  if (!stripe) throw new Error("Failed to load Stripe");

  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    successUrl: `${window.location.origin}/success`,
    cancelUrl: `${window.location.origin}/pricing`,
  });

  if (error) throw new Error(error.message);
}
