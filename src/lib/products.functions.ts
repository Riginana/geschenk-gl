import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import data from "@/data/products.json";

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
};

const PRODUCTS: ProductRow[] = (data.products as ProductRow[]).map((p) => ({
  ...p,
  hoverImage: p.hoverImage ?? undefined,
}));

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => PRODUCTS,
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(160) }).parse(d))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    return (
      PRODUCTS.find((p) => p.slug === data.slug) ??
      PRODUCTS.find((p) => p.id === data.slug) ??
      null
    );
  });
