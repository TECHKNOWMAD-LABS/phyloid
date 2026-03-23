/** Stripe payment tier definitions and client-side helpers */

export interface PricingTier {
  id: string;
  name: string;
  price: number;          // monthly USD
  maxOrganisms: number;
  maxDetail: number;
  galleryUploads: number;  // per month
  features: string[];
}

export const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Explorer",
    price: 0,
    maxOrganisms: 5,
    maxDetail: 2,
    galleryUploads: 3,
    features: [
      "Up to 5 organisms per world",
      "Basic detail levels (0-2)",
      "3 gallery uploads/month",
      "Community gallery browsing",
    ],
  },
  {
    id: "pro",
    name: "Researcher",
    price: 12,
    maxOrganisms: 50,
    maxDetail: 4,
    galleryUploads: 50,
    features: [
      "Up to 50 organisms per world",
      "High detail levels (0-4)",
      "50 gallery uploads/month",
      "Priority rendering",
      "Export as GLB/OBJ",
    ],
  },
  {
    id: "enterprise",
    name: "Laboratory",
    price: 49,
    maxOrganisms: 500,
    maxDetail: 5,
    galleryUploads: -1, // unlimited
    features: [
      "Up to 500 organisms per world",
      "Ultra detail (0-5)",
      "Unlimited gallery uploads",
      "API access",
      "Custom branding",
      "Team collaboration",
    ],
  },
];

/**
 * Look up a pricing tier by its string identifier.
 * @param id - Tier ID (e.g. "free", "pro", "enterprise")
 * @returns The matching PricingTier, or undefined if not found
 */
export function getTierById(id: string): PricingTier | undefined {
  return TIERS.find((t) => t.id === id);
}

/**
 * Returns true if the user may create one more organism given their current count.
 * @param tier - The user's active pricing tier
 * @param currentCount - Number of organisms already created in the current world
 * @returns true when currentCount < tier.maxOrganisms
 */
export function canCreateOrganism(tier: PricingTier, currentCount: number): boolean {
  return currentCount < tier.maxOrganisms;
}

/**
 * Returns true if the requested detail level is within the tier's allowance.
 * @param tier - The user's active pricing tier
 * @param detail - IcosahedronGeometry detail level (0-5)
 * @returns true when detail <= tier.maxDetail
 */
export function canUseDetail(tier: PricingTier, detail: number): boolean {
  return detail <= tier.maxDetail;
}

/**
 * Returns true if the user may upload to the gallery given their monthly usage.
 * @param tier - The user's active pricing tier
 * @param uploadsThisMonth - Number of gallery uploads already made this calendar month
 * @returns true if tier.galleryUploads is -1 (unlimited) or uploadsThisMonth < limit
 */
export function canUploadToGallery(tier: PricingTier, uploadsThisMonth: number): boolean {
  if (tier.galleryUploads === -1) return true;
  return uploadsThisMonth < tier.galleryUploads;
}

// Stripe Checkout redirect is in ./checkout.ts (lazy-loaded to avoid bundling @stripe/stripe-js)
