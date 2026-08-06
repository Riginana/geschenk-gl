import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { calculateDiscountedPrice, PRICE_BY_FORMAT_CENTS, PRICE_BY_FRAME_CENTS } from "@/lib/pricing";
import { resolveFramePriceCents, type FramePriceRow } from "@/lib/frame-pricing";

/** Publishable-key client for public catalog reads (RLS applies as anon). */
export function pub() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Server-side price for one configured item, mirroring the storefront rules:
 * size variant > frame price grid > product variant > base price + legacy offsets,
 * with the product's discount applied last.
 */
export async function computeUnitPriceCents(
  productId: string,
  personalization?: Record<string, string>,
): Promise<number | null> {
  const db = pub();
  const { data: product } = await db
    .from("products")
    .select("id, category, base_price_cents, discount_percent, is_active")
    .eq("id", productId)
    .maybeSingle();
  if (!product || !product.is_active) return null;

  const discount = (cents: number) => calculateDiscountedPrice(cents, product.discount_percent);

  // 1. Configurable products (Schiebebox): price comes from the size variant.
  const sizeId = personalization?.sizeId;
  if (sizeId) {
    const { data } = await db
      .from("product_size_variants")
      .select("price_cents, product_id, is_active")
      .eq("id", sizeId)
      .maybeSingle();
    if (!data || !data.is_active || data.product_id !== productId) return null;
    return discount(data.price_cents);
  }

  // 2. Frame products: price grid (product override wins over the global row).
  const frameSize = personalization?.frameSize;
  const frameVariant = personalization?.frameVariant;
  if (frameSize && frameVariant) {
    const { data } = await db
      .from("frame_prices")
      .select("id, product_id, size, variant, price_cents")
      .eq("size", frameSize)
      .eq("variant", frameVariant);
    const cents = resolveFramePriceCents((data ?? []) as FramePriceRow[], productId, frameSize, frameVariant);
    if (cents != null) return discount(cents);
  }

  // 3. Explicit product variant for the chosen format + material.
  const format = personalization?.format;
  const material = personalization?.material;
  if (format && material) {
    const { data } = await db
      .from("product_variants")
      .select("price_cents, format, material")
      .eq("product_id", productId)
      .eq("format", format)
      .eq("material", material)
      .maybeSingle();
    if (data) return discount(data.price_cents);
  }

  // 4. Base price plus legacy format/material offsets.
  const formatExtra = format ? PRICE_BY_FORMAT_CENTS[format] ?? 0 : 0;
  const frameExtra = material ? PRICE_BY_FRAME_CENTS[material] ?? 0 : 0;
  return discount(product.base_price_cents + formatExtra + frameExtra);
}


export function computeShippingCents(
  method: "standard" | "express",
  subtotalCents: number,
): number {
  if (method === "express") return 990;
  return subtotalCents >= 5000 ? 0 : 490;
}

export type CheckoutItemInput = {
  productId: string;
  slug: string;
  name: string;
  qty: number;
  personalization?: Record<string, string>;
};

export type VerifiedItem = CheckoutItemInput & { unitPriceCents: number };

/** Recomputes every price from the trusted catalog. Never trust client totals. */
export async function priceCart(
  items: CheckoutItemInput[],
  shippingMethod: "standard" | "express",
): Promise<{
  verifiedItems: VerifiedItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}> {
  const verifiedItems = await Promise.all(
    items.map(async (item) => {
      const unitPriceCents = await computeUnitPriceCents(item.productId, item.personalization);
      if (unitPriceCents == null) {
        throw new Error(
          "Ein Artikel im Warenkorb ist nicht mehr verfügbar. Bitte Seite neu laden und erneut versuchen.",
        );
      }
      return { ...item, unitPriceCents };
    }),
  );

  const subtotalCents = verifiedItems.reduce((sum, i) => sum + i.unitPriceCents * i.qty, 0);
  const shippingCents = computeShippingCents(shippingMethod, subtotalCents);
  return { verifiedItems, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}
