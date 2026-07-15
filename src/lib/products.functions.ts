import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import realData from "@/data/products.json";

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
  etsyUrl?: string;
  meta_description_de?: string;
  meta_description_en?: string;
};

type RealProduct = {
  listing_id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  url: string;
  quantity?: number;
  tags?: string[];
  materials?: string[];
  images?: Array<{ thumb?: string; medium?: string; full?: string; alt?: string | null }>;
};

function detectFormats(text: string): string[] {
  const t = text.toUpperCase();
  const found = ["A5", "A4", "A3"].filter(
    (f) => new RegExp(`\\b${f}\\b`).test(t) || t.includes(`DIN ${f}`),
  );
  return found.length ? found : ["A4"];
}

const OCCASION_KEYWORDS: Array<[string, RegExp]> = [
  ["hochzeit", /hochzeit|wedding/i],
  ["geburt", /\bgeburt\b|neugeboren|baby|taufe/i],
  ["taufe", /taufe/i],
  ["kommunion", /kommunion/i],
  ["konfirmation", /konfirmation/i],
  ["firmung", /firmung/i],
  ["abitur", /abitur|abschluss|graduation/i],
  ["jubilaeum", /jubil[aä]um/i],
  ["ruhestand", /ruhestand|rente|pension/i],
  ["weihnachten", /weihnacht|christmas/i],
  ["einzug", /einzug|einweihung|umzug|neues zuhause|traumhaus/i],
  ["mutterschutz", /mutterschutz|schwanger/i],
  ["ostern", /ostern|easter/i],
  ["jugendweihe", /jugendweihe/i],
  ["fuehrerschein", /f[üu]hrerschein/i],
  ["einschulung", /einschulung|schulanfang/i],
  ["geburtstag", /geburtstag|birthday/i],
];

function detectOccasion(text: string): string {
  for (const [key, re] of OCCASION_KEYWORDS) {
    if (re.test(text)) return key;
  }
  return "sonstiges";
}

function detectMaterial(text: string): string {
  const t = text.toLowerCase();
  if (/kraftpapier/.test(t)) return "kraftpapier";
  if (/karton|papier(?!fisch)/.test(t)) return "papier";
  return "holz";
}

const PRODUCTS: ProductRow[] = (realData.products as RealProduct[]).map((p, i) => {
  const haystack = `${p.title} ${(p.tags ?? []).join(" ")}`;
  const occasion = detectOccasion(haystack);
  const material = detectMaterial(`${p.title} ${(p.materials ?? []).join(" ")}`);
  const formats = detectFormats(`${p.title} ${p.description}`);
  const images = (p.images ?? [])
    .map((im) => im.medium ?? im.full ?? im.thumb ?? "")
    .filter(Boolean);
  return {
    id: `etsy-${p.listing_id}`,
    slug: `etsy-${p.listing_id}`,
    name_de: p.title,
    name_en: p.title,
    description_de: p.description,
    description_en: p.description,
    base_price_cents: Math.round(p.price * 100),
    occasion,
    material,
    formats,
    images: images.length ? images : ["/placeholder.svg"],
    hoverImage: images[1],
    badge: i < 8 ? "bestseller" : i < 16 ? "neu" : null,
    tags: p.tags ?? [],
    inStock: (p.quantity ?? 1) > 0,
    etsyUrl: p.url,
  };
});

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => PRODUCTS,
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    return PRODUCTS.find((p) => p.slug === data.slug) ?? null;
  });
