import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import rawProducts from "@/data/products.json";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

type RawProduct = { id: string; base_price_cents: number };
const PRODUCT_PRICE_CENTS = new Map<string, number>(
  (rawProducts.products as RawProduct[]).map((p) => [p.id, p.base_price_cents]),
);

const PRICE_BY_FORMAT_CENTS: Record<string, number> = { A5: 0, A4: 500, A3: 1200 };
const PRICE_BY_FRAME_CENTS: Record<string, number> = { papier: 0, kraftpapier: 200, holz: 800 };

function computeUnitPriceCents(productId: string, personalization?: Record<string, string>): number | null {
  const base = PRODUCT_PRICE_CENTS.get(productId);
  if (base == null) return null;
  const format = personalization?.format;
  const material = personalization?.material;
  const formatExtra = format ? PRICE_BY_FORMAT_CENTS[format] ?? 0 : 0;
  const frameExtra = material ? PRICE_BY_FRAME_CENTS[material] ?? 0 : 0;
  return base + formatExtra + frameExtra;
}

function computeShippingCents(method: "standard" | "express", subtotalCents: number): number {
  if (method === "express") return 990;
  return subtotalCents >= 5000 ? 0 : 490;
}

const orderSchema = z.object({
  email: z.string().email().max(255),
  address: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    street: z.string().min(1).max(120),
    houseNumber: z.string().min(1).max(20),
    plz: z.string().regex(/^\d{4,5}$/),
    city: z.string().min(1).max(80),
    country: z.string().min(2).max(60),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(120),
        slug: z.string().min(1).max(120),
        name: z.string().min(1).max(200),
        qty: z.number().int().min(1).max(50),
        personalization: z.record(z.string(), z.string().max(500)).optional(),
      }),
    )
    .min(1)
    .max(50),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["paypal", "stripe", "kreditkarte", "apple_pay", "google_pay"]),
  locale: z.enum(["de", "en"]).default("de"),
});

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    // Recompute prices server-side from the trusted catalog. Never trust client totals.
    const verifiedItems = data.items.map((item) => {
      const unitPriceCents = computeUnitPriceCents(item.productId, item.personalization);
      if (unitPriceCents == null) {
        throw new Error("One or more items in your cart are no longer available. Please refresh and try again.");
      }
      return { ...item, unitPriceCents };
    });

    const subtotalCents = verifiedItems.reduce((sum, i) => sum + i.unitPriceCents * i.qty, 0);
    const shippingCents = computeShippingCents(data.shippingMethod, subtotalCents);
    const totalCents = subtotalCents + shippingCents;

    const { data: row, error } = await pub()
      .from("orders")
      .insert({
        email: data.email,
        address: data.address,
        items: verifiedItems,
        shipping_method: data.shippingMethod,
        payment_method: data.paymentMethod,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        status: "pending_mock", // TODO: real payment integration
        locale: data.locale,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[submitOrder]", error.message);
      throw new Error("We couldn't place your order. Please try again.");
    }
    return { id: row.id };
  });
