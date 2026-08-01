import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { FRAME_SIZES, FRAME_VARIANTS, type FramePriceRow } from "@/lib/frame-pricing";

const sizeSchema = z.enum(FRAME_SIZES);
const variantSchema = z.enum(FRAME_VARIANTS);

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

/** Public: all frame prices (global defaults + per-product overrides). */
export const listFramePrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<FramePriceRow[]> => {
    const sb = pub();
    const { data, error } = await sb
      .from("frame_prices")
      .select("id,product_id,size,variant,price_cents");
    if (error) {
      console.error("[listFramePrices]", error.message);
      return [];
    }
    return (data ?? []) as FramePriceRow[];
  },
);

const upsertSchema = z.object({
  productId: z.string().uuid().nullable(),
  entries: z
    .array(
      z.object({
        size: sizeSchema,
        variant: variantSchema,
        priceCents: z.number().int().min(0).max(1000000),
      }),
    )
    .min(1)
    .max(50),
});

export const adminUpsertFramePrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const e of data.entries) {
      let q = supabaseAdmin
        .from("frame_prices")
        .select("id")
        .eq("size", e.size)
        .eq("variant", e.variant);
      q = data.productId ? q.eq("product_id", data.productId) : q.is("product_id", null);
      const { data: existing, error: selErr } = await q.maybeSingle();
      if (selErr) throw new Error(selErr.message);
      if (existing) {
        const { error } = await supabaseAdmin
          .from("frame_prices")
          .update({ price_cents: e.priceCents })
          .eq("id", (existing as { id: string }).id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabaseAdmin.from("frame_prices").insert({
          product_id: data.productId,
          size: e.size,
          variant: e.variant,
          price_cents: e.priceCents,
        } as any);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true, count: data.entries.length };
  });

const deleteSchema = z.object({
  productId: z.string().uuid(),
  size: sizeSchema,
  variant: variantSchema,
});

/** Removes a per-product override so the global price applies again. */
export const adminDeleteFramePriceOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("frame_prices")
      .delete()
      .eq("product_id", data.productId)
      .eq("size", data.size)
      .eq("variant", data.variant);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
