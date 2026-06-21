import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
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
        productId: z.string().uuid(),
        slug: z.string().min(1).max(120),
        name: z.string().min(1).max(200),
        qty: z.number().int().min(1).max(50),
        unitPriceCents: z.number().int().min(0).max(1_000_000),
        personalization: z.record(z.string(), z.string().max(500)).optional(),
      }),
    )
    .min(1)
    .max(50),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["paypal", "stripe", "kreditkarte", "apple_pay", "google_pay"]),
  subtotalCents: z.number().int().min(0),
  shippingCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  locale: z.enum(["de", "en"]).default("de"),
});

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { data: row, error } = await pub()
      .from("orders")
      .insert({
        email: data.email,
        address: data.address,
        items: data.items,
        shipping_method: data.shippingMethod,
        payment_method: data.paymentMethod,
        subtotal_cents: data.subtotalCents,
        shipping_cents: data.shippingCents,
        total_cents: data.totalCents,
        status: "pending_mock", // TODO: real payment integration
        locale: data.locale,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
