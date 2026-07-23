export const PROMO = 0.30; // 30% off — legacy fallback

// Legacy per-format / per-material offsets (used when a product has no variants).
export const PRICE_BY_FORMAT_CENTS: Record<string, number> = { A5: 0, A4: 300, A3: 600 };
export const PRICE_BY_FRAME_CENTS: Record<string, number> = { papier: 0, kraftpapier: 0, holz: 300 };

/** Legacy: apply the flat 30% promo. */
export function withPromo(cents: number): number {
  return Math.round(cents * (1 - PROMO));
}

/**
 * Canonical discount formula shared by storefront and admin:
 *   displayed_price = round(price_cents * (1 - discount_percent / 100))
 */
export function calculateDiscountedPrice(cents: number, discountPercent: number | null | undefined): number {
  const d = Math.max(0, Math.min(100, Number(discountPercent ?? 0)));
  if (!d) return cents;
  return Math.round(cents * (1 - d / 100));
}
