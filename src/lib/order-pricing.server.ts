import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import rawProducts from "@/data/products.json";

/** Publishable-key client for public catalog reads (RLS applies as anon). */
export function pub() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type RawProduct = { id: string; base_price_cents: number };
const PRODUCT_PRICE_CENTS = new Map<string, number>(
  (rawProducts.products as RawProduct[]).map((p) => [p.id, p.base_price_cents]),
);

const PRICE_BY_FORMAT_CENTS: Record<string, number> = { A5: 0, A4: 500, A3: 1200 };
const PRICE_BY_FRAME_CENTS: Record<string, number> = { papier: 0, kraftpapier: 200, holz: 800 };

/**
 * Server-side price for one configured item.
 * Configurable products (Schiebebox) price from `product_size_variants`
 * (single source of truth), everything else from the static catalog price.
 */
export async function computeUnitPriceCents(
  productId: string,
  personalization?: Record<string, string>,
): Promise<number | null> {
  const sizeId = personalization?.sizeId;
  if (sizeId) {
    const { data } = await pub()
      .from("product_size_variants")
      .select("price_cents, product_id, is_active")
      .eq("id", sizeId)
      .maybeSingle();
    if (!data || !data.is_active || data.product_id !== productId) return null;
    const { data: prod } = await pub()
      .from("products")
      .select("discount_percent")
      .eq("id", productId)
      .maybeSingle();
    const pct = Math.min(100, Math.max(0, prod?.discount_percent ?? 0));
    return Math.round(data.price_cents * (1 - pct / 100));
  }

  const base = PRODUCT_PRICE_CENTS.get(productId);
  if (base == null) return null;
  const format = personalization?.format;
  const material = personalization?.material;
  const formatExtra = format ? PRICE_BY_FORMAT_CENTS[format] ?? 0 : 0;
  const frameExtra = material ? PRICE_BY_FRAME_CENTS[material] ?? 0 : 0;
  return base + formatExtra + frameExtra;
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
