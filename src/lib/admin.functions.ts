import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

// ---------------- Products ----------------

export type AdminProductRow = {
  id: string;
  slug: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  base_price_cents: number;
  discount_percent: number;
  occasion: string;
  category: string | null;
  material: string;
  material_label: string | null;
  hero_image: string | null;
  hover_image: string | null;
  is_active: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  in_stock: boolean;
  sort_order: number | null;
  badge: string | null;
  meta_description_de: string | null;
  meta_description_en: string | null;
  product_video_url: string | null;
};

const PRODUCT_COLS =
  "id,slug,name_de,name_en,description_de,description_en,base_price_cents,discount_percent,occasion,category,material,material_label,hero_image,hover_image,is_active,is_bestseller,is_featured,in_stock,sort_order,badge,meta_description_de,meta_description_en,product_video_url";


export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminProductRow[]> => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(PRODUCT_COLS)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name_de", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as any;
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: prod, error: e1 }, { data: imgs, error: e2 }, { data: variants, error: e3 }] =
      await Promise.all([
        supabaseAdmin.from("products").select(PRODUCT_COLS).eq("id", data.id).maybeSingle(),
        supabaseAdmin.from("product_images").select("*").eq("product_id", data.id).order("sort_order", { ascending: true }),
        supabaseAdmin.from("product_variants").select("*").eq("product_id", data.id).order("sort_order", { ascending: true }),
      ]);
    if (e1 || e2 || e3) throw new Error(e1?.message || e2?.message || e3?.message || "Failed");
    if (!prod) throw new Error("Not found");
    return { product: prod as AdminProductRow, images: imgs ?? [], variants: variants ?? [] };
  });

const productUpdateSchema = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      name_de: z.string().min(1).max(500).optional(),
      name_en: z.string().min(1).max(500).optional(),
      description_de: z.string().max(20000).nullable().optional(),
      description_en: z.string().max(20000).nullable().optional(),
      slug: z.string().min(1).max(200).optional(),
      base_price_cents: z.number().int().min(0).max(1000000).optional(),
      discount_percent: z.number().int().min(0).max(100).optional(),
      occasion: z.string().max(100).optional(),
      category: z.string().max(100).nullable().optional(),
      material: z.string().max(100).optional(),
      material_label: z.string().max(200).nullable().optional(),
      hero_image: z.string().max(2000).nullable().optional(),
      hover_image: z.string().max(2000).nullable().optional(),
      badge: z.string().max(50).nullable().optional(),
      meta_description_de: z.string().max(500).nullable().optional(),
      meta_description_en: z.string().max(500).nullable().optional(),
      product_video_url: z.string().max(2000).nullable().optional(),
      is_active: z.boolean().optional(),
      is_bestseller: z.boolean().optional(),
      is_featured: z.boolean().optional(),
      in_stock: z.boolean().optional(),
      sort_order: z.number().int().optional(),

    })
    .refine((v) => Object.keys(v).length > 0, "patch is empty"),
});

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => productUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").update(data.patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminBulkSetActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ ids: z.array(z.string().uuid()).min(1).max(500), is_active: z.boolean() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: data.is_active })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

// ---------------- Storage uploads (signed URL) ----------------

const UPLOAD_BUCKET = "product-images";

export const adminCreateUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        filename: z.string().min(1).max(200),
        content_type: z.string().min(1).max(100),
        kind: z.enum(["image", "video"]),
        size: z.number().int().min(1).max(100 * 1024 * 1024),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const maxImage = 20 * 1024 * 1024;
    const maxVideo = 100 * 1024 * 1024;
    if (data.kind === "image" && data.size > maxImage) {
      throw new Error("Bild überschreitet 20 MB Limit");
    }
    if (data.kind === "video" && data.size > maxVideo) {
      throw new Error("Video überschreitet 100 MB Limit");
    }
    const allowedImage = ["image/jpeg", "image/png", "image/webp"];
    const allowedVideo = ["video/mp4", "video/webm"];
    const allowed = data.kind === "image" ? allowedImage : allowedVideo;
    if (!allowed.includes(data.content_type)) {
      throw new Error(`Format nicht unterstützt: ${data.content_type}`);
    }
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `${data.product_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(UPLOAD_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Signed URL Fehler");
    const { data: pub } = supabaseAdmin.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
    return {
      bucket: UPLOAD_BUCKET,
      path,
      token: signed.token,
      signedUrl: signed.signedUrl,
      publicUrl: pub.publicUrl,
    };
  });

// ---------------- Product images ----------------


export const adminAddImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        url: z.string().url().max(2000),
        role: z.string().max(50).default("gallery"),
        alt: z.string().max(500).nullable().optional(),
        sort_order: z.number().int().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("product_images")
      .insert({
        product_id: data.product_id,
        url: data.url,
        role: data.role,
        alt: data.alt ?? null,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("product_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorderImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        items: z
          .array(z.object({ id: z.string().uuid(), sort_order: z.number().int() }))
          .min(1)
          .max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const it of data.items) {
      const { error } = await supabaseAdmin
        .from("product_images")
        .update({ sort_order: it.sort_order })
        .eq("id", it.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ---------------- Variants ----------------

export const adminAddVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        format: z.string().max(100).nullable().optional(),
        material: z.string().min(1).max(100),
        price_cents: z.number().int().min(0).max(1000000),
        is_default: z.boolean().default(false),
        sort_order: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("product_variants")
      .insert({
        product_id: data.product_id,
        format: data.format ?? null,
        material: data.material,
        price_cents: data.price_cents,
        is_default: data.is_default,
        sort_order: data.sort_order,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        patch: z
          .object({
            format: z.string().max(100).nullable().optional(),
            material: z.string().min(1).max(100).optional(),
            price_cents: z.number().int().min(0).max(1000000).optional(),
            is_default: z.boolean().optional(),
            sort_order: z.number().int().optional(),
          })
          .refine((v) => Object.keys(v).length > 0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.patch.is_default === true) {
      const { data: v } = await supabaseAdmin
        .from("product_variants")
        .select("product_id")
        .eq("id", data.id)
        .maybeSingle();
      if (v?.product_id) {
        await supabaseAdmin
          .from("product_variants")
          .update({ is_default: false })
          .eq("product_id", v.product_id);
      }
    }
    const { error } = await supabaseAdmin
      .from("product_variants")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("product_variants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
