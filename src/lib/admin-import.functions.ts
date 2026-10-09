import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden: admin only");
}

/** Returns which slugs / etsy ids already exist (drafts included). */
export const adminCheckImportDuplicates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ slugs: z.array(z.string().max(200)).max(500), etsyIds: z.array(z.string().max(50)).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("products").select("id,slug,tags");
    if (error) throw new Error(error.message);
    const slugSet = new Set(data.slugs);
    const etsySet = new Set(data.etsyIds.map((e) => `etsy:${e}`));
    const slugs: string[] = [];
    const etsyIds: string[] = [];
    for (const r of rows ?? []) {
      if (slugSet.has(r.slug)) slugs.push(r.slug);
      const tags = Array.isArray(r.tags) ? (r.tags as unknown[]) : [];
      for (const t of tags) if (typeof t === "string" && etsySet.has(t)) etsyIds.push(t.slice(5));
    }
    return { slugs, etsyIds };
  });

const draftSchema = z.object({
  etsy_id: z.string().trim().min(1).max(50),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  name_de: z.string().trim().min(1).max(500),
  name_en: z.string().trim().min(1).max(500),
  description_de: z.string().max(20000),
  description_en: z.string().max(20000),
  category: z.string().trim().min(1).max(100),
  occasion: z.string().trim().min(1).max(100),
  frame_material: z.enum(["papier", "holz", "hdf"]),
  base_price_cents: z.number().int().min(0).max(1000000),
  discount_percent: z.number().int().min(0).max(100),
});

/** Creates a hidden draft product. Refuses if slug or etsy id already exists. */
export const adminCreateImportDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => draftSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tag = `etsy:${data.etsy_id}`;
    const { data: dupSlug } = await supabaseAdmin.from("products").select("id").eq("slug", data.slug).maybeSingle();
    if (dupSlug) throw new Error(`Slug existiert bereits: ${data.slug}`);
    const { data: dupEtsy } = await supabaseAdmin
      .from("products")
      .select("id")
      .contains("tags", JSON.stringify([tag]))
      .maybeSingle();
    if (dupEtsy) throw new Error(`Etsy-ID existiert bereits: ${data.etsy_id}`);
    const { etsy_id: _e, ...rest } = data;
    const { data: created, error } = await supabaseAdmin
      .from("products")
      .insert({ ...rest, material: "karton", is_active: false, tags: [tag] } as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (created as { id: string }).id };
  });

export const adminFinalizeImportedProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        images: z.array(z.object({ url: z.string().url().max(2000), alt: z.string().max(500) })).min(1).max(30),
        hero_index: z.number().int().min(0),
        video_url: z.string().url().max(2000).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hero = data.images[data.hero_index] ?? data.images[0];
    const rows = data.images.map((im, i) => ({
      product_id: data.product_id,
      url: im.url,
      alt: im.alt,
      role: im.url === hero.url ? "hero" : "gallery",
      sort_order: i,
    }));
    const { error: e1 } = await supabaseAdmin.from("product_images").insert(rows);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabaseAdmin
      .from("products")
      .update({ hero_image: hero.url, product_video_url: data.video_url } as any)
      .eq("id", data.product_id);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

/** Removes a partially imported draft and its uploaded files. Only drafts. */
export const adminRollbackImportDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("products").select("is_active").eq("id", data.product_id).maybeSingle();
    if (!p || p.is_active) return { ok: false };
    const { data: files } = await supabaseAdmin.storage.from("product-images").list(data.product_id, { limit: 100 });
    if (files?.length) {
      await supabaseAdmin.storage.from("product-images").remove(files.map((f) => `${data.product_id}/${f.name}`));
    }
    await supabaseAdmin.from("product_images").delete().eq("product_id", data.product_id);
    await supabaseAdmin.from("products").delete().eq("id", data.product_id);
    return { ok: true };
  });
