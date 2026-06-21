import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type ReviewRow = {
  id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  text_de: string;
  text_en: string;
  photo_url: string | null;
  occasion: string | null;
  created_at: string;
};

export const listReviews = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ productId: z.string().uuid().optional(), limit: z.number().int().min(1).max(100).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<ReviewRow[]> => {
    let q = pub()
      .from("reviews")
      .select("id,product_id,customer_name,rating,text_de,text_en,photo_url,occasion,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.productId) q = q.eq("product_id", data.productId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ReviewRow[];
  });
