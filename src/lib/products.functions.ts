import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type ProductVariant = {
  id: string;
  format: string;
  material: string;
  price_cents: number;
  is_default: boolean;
  sort_order: number;
};

export type ProductRow = {
  id: string;
  slug: string;
  name_de: string;
  name_en: string;
  description_de: string;
  description_en: string;
  base_price_cents: number;
  occasion: string;
  material: string;
  material_label?: string;
  formats: string[];
  images: string[];
  hoverImage?: string;
  heroImage?: string;
  badge: string | null;
  tags: string[];
  inStock: boolean;

  meta_description_de?: string;
  meta_description_en?: string;

  discount_percent: number;
  is_bestseller: boolean;
  variants: ProductVariant[];
};

type DbProduct = {
  id: string;
  slug: string;
  name_de: string;
  name_en: string;
  description_de: string | null;
  description_en: string | null;
  base_price_cents: number;
  occasion: string;
  material: string;
  material_label: string | null;
  badge: string | null;
  hero_image: string | null;
  hover_image: string | null;
  is_bestseller: boolean | null;
  in_stock: boolean | null;
  tags: unknown;
  meta_description_de: string | null;
  meta_description_en: string | null;
  discount_percent: number | null;
  sort_order: number | null;
};

type DbImage = { product_id: string; url: string; role: string; sort_order: number };
type DbVariant = { id: string; product_id: string; format: string; material: string; price_cents: number; is_default: boolean; sort_order: number };

const IMAGE_ROLE_ORDER: Record<string, number> = { hero: 0, product: 1, gallery: 2, thumbnail: 3 };

function toTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

function assemble(
  p: DbProduct,
  imgs: DbImage[],
  variants: DbVariant[],
): ProductRow {
  const orderedImgs = imgs
    .slice()
    .sort((a, b) => {
      const ra = IMAGE_ROLE_ORDER[a.role] ?? 9;
      const rb = IMAGE_ROLE_ORDER[b.role] ?? 9;
      if (ra !== rb) return ra - rb;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  const seen = new Set<string>();
  const images: string[] = [];
  if (p.hero_image) {
    images.push(p.hero_image);
    seen.add(p.hero_image);
  }
  for (const im of orderedImgs) {
    if (!seen.has(im.url)) {
      images.push(im.url);
      seen.add(im.url);
    }
  }

  const vsorted = variants
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const formats = Array.from(new Set(vsorted.map((v) => v.format))).filter(Boolean);

  const badge: string | null = p.badge ?? (p.is_bestseller ? "bestseller" : null);

  return {
    id: p.id,
    slug: p.slug,
    name_de: p.name_de,
    name_en: p.name_en,
    description_de: p.description_de ?? "",
    description_en: p.description_en ?? "",
    base_price_cents: p.base_price_cents,
    occasion: p.occasion,
    material: p.material,
    material_label: p.material_label ?? undefined,
    formats,
    images,
    hoverImage: p.hover_image ?? undefined,
    heroImage: p.hero_image ?? undefined,
    badge,
    tags: toTags(p.tags),
    inStock: p.in_stock ?? true,
    meta_description_de: p.meta_description_de ?? undefined,
    meta_description_en: p.meta_description_en ?? undefined,
    discount_percent: p.discount_percent ?? 0,
    is_bestseller: !!p.is_bestseller,
    variants: vsorted.map((v) => ({
      id: v.id,
      format: v.format,
      material: v.material,
      price_cents: v.price_cents,
      is_default: v.is_default,
      sort_order: v.sort_order ?? 0,
    })),
  };
}

const PRODUCT_COLS =
  "id,slug,name_de,name_en,description_de,description_en,base_price_cents,occasion,material,material_label,badge,hero_image,hover_image,is_bestseller,in_stock,tags,meta_description_de,meta_description_en,discount_percent,sort_order";

export const listProducts = createServerFn({ method: "GET" }).handler(async (): Promise<ProductRow[]> => {
  const sb = pub();
  const [{ data: prods, error: e1 }, { data: imgs, error: e2 }, { data: vars, error: e3 }] = await Promise.all([
    sb.from("products").select(PRODUCT_COLS).eq("is_active", true).order("sort_order", { ascending: true, nullsFirst: false }).order("name_de", { ascending: true }),
    sb.from("product_images").select("product_id,url,role,sort_order"),
    sb.from("product_variants").select("id,product_id,format,material,price_cents,is_default,sort_order"),
  ]);
  if (e1 || e2 || e3) {
    console.error("[listProducts]", e1?.message, e2?.message, e3?.message);
    throw new Error("We couldn't load products right now. Please try again.");
  }
  const imgByPid = new Map<string, DbImage[]>();
  for (const im of (imgs ?? []) as DbImage[]) {
    const a = imgByPid.get(im.product_id) ?? [];
    a.push(im);
    imgByPid.set(im.product_id, a);
  }
  const varByPid = new Map<string, DbVariant[]>();
  for (const v of (vars ?? []) as DbVariant[]) {
    const a = varByPid.get(v.product_id) ?? [];
    a.push(v);
    varByPid.set(v.product_id, a);
  }
  return ((prods ?? []) as unknown as DbProduct[]).map((p) =>
    assemble(p, imgByPid.get(p.id) ?? [], varByPid.get(p.id) ?? []),
  );
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    const sb = pub();
    // Try slug first, then id (route param can be either).
    const bySlug = await sb.from("products").select(PRODUCT_COLS).eq("is_active", true).eq("slug", data.slug).maybeSingle();
    let prod = (bySlug.data as unknown as DbProduct | null) ?? null;
    if (!prod) {
      const byId = await sb.from("products").select(PRODUCT_COLS).eq("is_active", true).eq("id", data.slug).maybeSingle();
      prod = (byId.data as unknown as DbProduct | null) ?? null;
    }
    if (!prod) return null;
    const [{ data: imgs }, { data: vars }] = await Promise.all([
      sb.from("product_images").select("product_id,url,role,sort_order").eq("product_id", prod.id),
      sb.from("product_variants").select("id,product_id,format,material,price_cents,is_default,sort_order").eq("product_id", prod.id),
    ]);
    return assemble(prod, (imgs ?? []) as DbImage[], (vars ?? []) as DbVariant[]);
  });
