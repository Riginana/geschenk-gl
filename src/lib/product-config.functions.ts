import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Motif, SizeVariant } from "@/lib/product-config";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const SIZE_COLS = "id,product_id,label,dimensions,price_cents,is_active,is_default,sort_order";
const MOTIF_COLS =
  "id,product_id,number,title,description,predefined_text,preview_image_url,allows_custom_text,requires_custom_text,custom_text_max_length,is_active,sort_order";

export type ProductConfig = { sizes: SizeVariant[]; motifs: Motif[] };

/** All active size variants + motifs across the catalog (used by PDP and cards). */
export const listProductConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductConfig> => {
    const sb = pub();
    const [{ data: sizes, error: e1 }, { data: motifs, error: e2 }] = await Promise.all([
      sb.from("product_size_variants").select(SIZE_COLS).eq("is_active", true),
      sb.from("product_motifs").select(MOTIF_COLS).eq("is_active", true),
    ]);
    if (e1 || e2) {
      console.error("[listProductConfig]", e1?.message, e2?.message);
      throw new Error("We couldn't load product options right now. Please try again.");
    }
    return {
      sizes: (sizes ?? []) as SizeVariant[],
      motifs: (motifs ?? []) as Motif[],
    };
  },
);
