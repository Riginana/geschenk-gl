import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import raw from "@/data/etsy-products.json";
import type { Database } from "@/integrations/supabase/types";

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
  meta_description_de?: string;
  meta_description_en?: string;

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
  const t = text.toUpperCase();
  const found = ["A5", "A4", "A3"].filter(
    (f) => new RegExp(`\\b${f}\\b`).test(t) || t.includes(`DIN ${f}`),
  );
  return found.length ? found : ["A4"];
}

const OCCASION_EN: Record<string, string> = {
  hochzeit: "Wedding",
  geburtstag: "Birthday",
  geburt: "New Baby",
  taufe: "Baptism",
  kommunion: "Communion",
  konfirmation: "Confirmation",
  firmung: "Catholic Confirmation",
  abitur: "Graduation",
  jubilaeum: "Anniversary",
  ruhestand: "Retirement",
  weihnachten: "Christmas",
  einzug: "Housewarming",
  mutterschutz: "Maternity",
  ostern: "Easter",
  jugendweihe: "Youth Ceremony",
  fuehrerschein: "Driver's License",
  einschulung: "First Day at School",
  abschied: "Farewell",
  sonstiges: "Special Occasion",
};

const MATERIAL_EN: Record<string, string> = {
  holz: "real wood",
  karton: "kraft paper",
  papier: "premium paper",
  kraftpapier: "kraft paper",
};

function translateTitle(occasion: string, material: string, formats: string[]): string {
  const occ = OCCASION_EN[occasion] || "Special Occasion";
  const mat = MATERIAL_EN[material] || "wood";
  const fmt = formats[0] || "A4";
  return `Personalized ${occ} Money Gift — ${mat} frame ${fmt}, handcrafted by DigiNutz`;
}

function translateDescription(occasion: string, material: string, formats: string[]): string {
  const occ = OCCASION_EN[occasion] || "special occasion";
  const mat = MATERIAL_EN[material] || "premium wood";
  const fmt = formats.join(" / ") || "A4";
  return [
    `This personalized money gift for a ${occ.toLowerCase()} turns cash into a lasting keepsake.`,
    `Crafted in our small atelier from ${mat}, precisely cut and finished by hand.`,
    `Available in ${fmt} format and personalized with names, dates and your own dedication — a gift that will be remembered long after the celebration.`,
    `Production time 3–5 business days. Insured DHL shipping.`,
  ].join("\n\n");
}

const FALLBACK_PRODUCTS: ProductRow[] = (raw as RawEtsy[]).map((p, i) => {
  const formats = detectFormats(`${p.title} ${p.description}`);
  return {
    id: p.id,
    slug: p.id,
    name_de: p.title,
    name_en: translateTitle(p.occasion, p.material, formats),
    description_de: p.description,
    description_en: translateDescription(p.occasion, p.material, formats),
    base_price_cents: Math.round(p.price * 100),
    occasion: p.occasion,
    material: p.material,
    formats,
    images: [p.image],
    badge: i < 8 ? "bestseller" : i < 16 ? "neu" : null,
    tags: p.tags ?? [],
    inStock: p.inStock ?? true,
  };
});


function getSupabase() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

type DbProduct = Database["public"]["Tables"]["products"]["Row"];

function mapDbProduct(p: DbProduct, fallbackIdx: number): ProductRow {
  const fallback = FALLBACK_PRODUCTS.find((f) => f.slug === p.slug);
  return {
    id: p.id,
    slug: p.slug,
    name_de: p.name_de,
    name_en: p.name_en,
    description_de: p.description_de,
    description_en: p.description_en,
    base_price_cents: p.base_price_cents,
    occasion: p.occasion,
    material: p.material,
    formats: (p.formats as string[]) ?? ["A4"],
    images: (p.images as string[]) ?? [],
    badge: p.badge,
    tags: fallback?.tags ?? [],
    inStock: true,
    meta_description_de: (p as unknown as { meta_description_de?: string | null }).meta_description_de ?? undefined,
    meta_description_en: (p as unknown as { meta_description_en?: string | null }).meta_description_en ?? undefined,
  };
}


export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => {
    try {
      const { data, error } = await getSupabase()
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data.map((p, i) => mapDbProduct(p, i));
    } catch (e) {
      console.error("[listProducts] Supabase failed, using fallback:", e);
    }
    return FALLBACK_PRODUCTS;
  },
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    try {
      const { data: row, error } = await getSupabase()
        .from("products")
        .select("*")
        .eq("slug", data.slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (row) return mapDbProduct(row, 0);
    } catch (e) {
      console.error("[getProductBySlug] Supabase failed, using fallback:", e);
    }
    return FALLBACK_PRODUCTS.find((p) => p.slug === data.slug) ?? null;
  });
