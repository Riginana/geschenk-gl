import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

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
  badge: string | null;
};

export const listProducts = createServerFn({ method: "GET" }).handler(async (): Promise<ProductRow[]> => {
  const { data, error } = await pub()
    .from("products")
    .select("id,slug,name_de,name_en,description_de,description_en,base_price_cents,occasion,material,formats,images,badge")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProductRow[];
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    const { data: row, error } = await pub()
      .from("products")
      .select("id,slug,name_de,name_en,description_de,description_en,base_price_cents,occasion,material,formats,images,badge")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as ProductRow | null;
  });
