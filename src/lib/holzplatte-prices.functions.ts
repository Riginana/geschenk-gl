import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { HOLZPLATTE_SIZES, type HolzplattePriceRow } from "@/lib/holzplatte-pricing";

const sizeSchema = z.enum(HOLZPLATTE_SIZES);

function pub() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

function normalize(rows: any[]): HolzplattePriceRow[] {
  return rows.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    size: r.size,
    original_price: Number(r.original_price),
    discount_percent: Number(r.discount_percent),
    updated_at: r.updated_at,
  }));
}

/** Public: all Holzplatte prices (global defaults + per-product overrides). */
export const listHolzplattePrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<HolzplattePriceRow[]> => {
    const sb = pub();
    const { data, error } = await (sb as any)
      .from("holzplatte_prices")
      .select("id,product_id,size,original_price,discount_percent,updated_at");
    if (error) {
      console.error("[listHolzplattePrices]", error.message);
      return [];
    }
    return normalize(data ?? []);
  },
);

const upsertSchema = z.object({
  productId: z.string().uuid().nullable(),
  entries: z
    .array(
      z.object({
        size: sizeSchema,
        originalPrice: z.number().min(0).max(100000),
        discountPercent: z.number().min(0).max(100),
      }),
    )
    .min(1)
    .max(10),
});

export const adminUpsertHolzplattePrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    for (const e of data.entries) {
      let q = db.from("holzplatte_prices").select("id").eq("size", e.size);
      q = data.productId ? q.eq("product_id", data.productId) : q.is("product_id", null);
      const { data: existing, error: selErr } = await q.maybeSingle();
      if (selErr) throw new Error(selErr.message);
      if (existing) {
        const { error } = await db
          .from("holzplatte_prices")
          .update({ original_price: e.originalPrice, discount_percent: e.discountPercent })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await db.from("holzplatte_prices").insert({
          product_id: data.productId,
          size: e.size,
          original_price: e.originalPrice,
          discount_percent: e.discountPercent,
        });
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true, count: data.entries.length };
  });

const deleteSchema = z.object({
  productId: z.string().uuid(),
  size: sizeSchema,
});

/** Removes a per-product override so the global price applies again. */
export const adminDeleteHolzplattePriceOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("holzplatte_prices")
      .delete()
      .eq("product_id", data.productId)
      .eq("size", data.size);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
