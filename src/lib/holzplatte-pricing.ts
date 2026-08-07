export const HOLZPLATTE_SIZES = ["13x18", "11x15"] as const;
export type HolzplatteSize = (typeof HOLZPLATTE_SIZES)[number];

export const HOLZPLATTE_SIZE_LABELS: Record<string, string> = {
  "13x18": "13 × 18 cm",
  "11x15": "11 × 15 cm",
};

export const HOLZPLATTE_DEFAULT_SIZE: HolzplatteSize = "13x18";

export type HolzplattePriceRow = {
  id: string;
  product_id: string | null;
  size: string;
  original_price: number;
  discount_percent: number;
  updated_at: string;
};

export function isHolzplatteCategory(category?: string | null) {
  return category === "holzplatte";
}

/** Product override wins over the global (product_id = null) row. */
export function resolveHolzplattePrice(
  rows: HolzplattePriceRow[],
  productId: string | null,
  size: string,
): HolzplattePriceRow | null {
  const match = rows.filter((r) => r.size === size);
  if (productId) {
    const override = match.find((r) => r.product_id === productId);
    if (override) return override;
  }
  return match.find((r) => r.product_id === null) ?? null;
}

/** final = original * (1 - discount/100), rounded to 2 decimals, returned in cents. */
export function finalPriceCents(originalPrice: number, discountPercent: number): number {
  const d = Math.max(0, Math.min(100, Number(discountPercent ?? 0)));
  return Math.round(Number(originalPrice) * (1 - d / 100) * 100);
}

export function euroToCents(price: number): number {
  return Math.round(Number(price) * 100);
}
