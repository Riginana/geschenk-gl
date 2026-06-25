import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import raw from "@/data/etsy-products.json";
import { secondaryImageFor } from "@/lib/product-images";

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
  formats: string[];
  images: string[];
  hoverImage?: string;
  badge: string | null;
  tags: string[];
  inStock: boolean;
};

type RawEtsy = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  occasion: string;
  material: string;
  image: string;
  tags?: string[];
  inStock?: boolean;
  quantity?: number;
};

function detectFormats(text: string): string[] {
  const found = new Set<string>();
  const t = text.toUpperCase();
  for (const f of ["A3", "A4", "A5"]) {
    if (new RegExp(`\\b${f}\\b`).test(t) || t.includes(`DIN ${f}`)) found.add(f);
  }
  if (found.size === 0) found.add("A4");
  // Sort A5, A4, A3
  return ["A5", "A4", "A3"].filter((f) => found.has(f));
}

const PRODUCTS: ProductRow[] = (raw as RawEtsy[]).map((p, i) => ({
  id: p.id,
  slug: p.id,
  name_de: p.title,
  name_en: p.title,
  description_de: p.description,
  description_en: p.description,
  base_price_cents: Math.round(p.price * 100),
  occasion: p.occasion,
  material: p.material,
  formats: detectFormats(`${p.title} ${p.description}`),
  images: [p.image],
  badge: i < 8 ? "bestseller" : i < 16 ? "neu" : null,
  tags: p.tags ?? [],
  inStock: p.inStock ?? true,
}));

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => PRODUCTS,
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    return PRODUCTS.find((p) => p.slug === data.slug) ?? null;
  });
