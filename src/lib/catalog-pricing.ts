import { calculateDiscountedPrice } from "@/lib/pricing";
import { fromPriceCents, isConfigurableCategory, type Motif, type SizeVariant } from "@/lib/product-config";
import { resolveFramePriceCents, FRAME_SIZES, FRAME_VARIANTS, type FramePriceRow } from "@/lib/frame-pricing";
import {
  HOLZPLATTE_SIZES,
  finalPriceCents,
  isHolzplatteCategory,
  resolveHolzplattePrice,
  euroToCents,
  type HolzplattePriceRow,
} from "@/lib/holzplatte-pricing";

export type CatalogPriceSources = {
  sizes?: SizeVariant[];
  motifs?: Motif[];
  framePrices?: FramePriceRow[];
  holzplattePrices?: HolzplattePriceRow[];
};

export type CatalogPrice = {
  /** Original ("list") price before any discount, in cents. */
  listCents: number;
  /** Price actually charged, in cents. */
  finalCents: number;
  discountPercent: number;
};

type CatalogProduct = {
  id: string;
  category?: string | null;
  base_price_cents: number;
  discount_percent?: number | null;
};

export function isFrameCategory(category?: string | null): boolean {
  return (category ?? "").toLowerCase() === "bilderrahmen";
}

/**
 * Cheapest ("Ab …") price of a product, using the same source of truth the
 * product page and the server-side checkout validation use.
 */
export function catalogFromPrice(product: CatalogProduct, src: CatalogPriceSources = {}): CatalogPrice {
  const discountPercent = Math.max(0, Math.min(100, Number(product.discount_percent ?? 0)));
  const withDiscount = (listCents: number): CatalogPrice => ({
    listCents,
    finalCents: calculateDiscountedPrice(listCents, discountPercent),
    discountPercent,
  });

  // 1. Configurable products (Schiebebox / Holzbox): size + motif surcharge.
  if (isConfigurableCategory(product.category)) {
    const sizes = (src.sizes ?? []).filter((s) => s.product_id === product.id);
    const motifs = (src.motifs ?? []).filter((m) => m.product_id === product.id);
    const cents = fromPriceCents(sizes, motifs);
    if (cents != null) return withDiscount(cents);
  }

  // 2. Holzplatte: discount lives in the price table, not on the product.
  if (isHolzplatteCategory(product.category) && src.holzplattePrices?.length) {
    let best: CatalogPrice | null = null;
    for (const size of HOLZPLATTE_SIZES) {
      const row = resolveHolzplattePrice(src.holzplattePrices, product.id, size);
      if (!row) continue;
      const candidate: CatalogPrice = {
        listCents: euroToCents(row.original_price),
        finalCents: finalPriceCents(row.original_price, row.discount_percent),
        discountPercent: Math.max(0, Math.min(100, Number(row.discount_percent ?? 0))),
      };
      if (!best || candidate.finalCents < best.finalCents) best = candidate;
    }
    if (best) return best;
  }

  // 3. Bilderrahmen: cheapest entry of the frame price grid.
  if (isFrameCategory(product.category) && src.framePrices?.length) {
    let min: number | null = null;
    for (const size of FRAME_SIZES) {
      for (const variant of FRAME_VARIANTS) {
        const cents = resolveFramePriceCents(src.framePrices, product.id, size, variant);
        if (cents == null) continue;
        if (min == null || cents < min) min = cents;
      }
    }
    if (min != null) return withDiscount(min);
  }

  // 4. Fallback: product base price.
  return withDiscount(product.base_price_cents);
}
