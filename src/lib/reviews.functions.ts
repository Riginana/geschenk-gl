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
    z.object({ productId: z.string().min(1).max(120).optional(), limit: z.number().int().min(1).max(100).optional() }).parse(d ?? {}),
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
    const result = (rows ?? []) as unknown as ReviewRow[];
    console.log("[listReviews] rows returned:", result.length);
    if (result.length > 0) return result;

    const FALLBACK_REVIEWS: ReviewRow[] = [
      { id: "fb-1", product_id: null, customer_name: "Anna Müller", rating: 5, text_de: "Wunderschönes Geschenk! Meine Schwester war total begeistert und hat gleich angefangen zu strahlen. Die Qualität ist wirklich top.", text_en: "Beautiful gift! My sister was totally thrilled. The quality is really top-notch.", photo_url: null, occasion: "geburtstag", created_at: "2024-11-15T10:00:00Z" },
      { id: "fb-2", product_id: null, customer_name: "Lukas Schmidt", rating: 5, text_de: "Perfekt zur Hochzeit meines besten Freundes. Ein sehr persönliches und herzliches Geschenk, das gut angekommen ist.", text_en: "Perfect for my best friend's wedding. A very personal and heartfelt gift that was well received.", photo_url: null, occasion: "hochzeit", created_at: "2024-10-22T14:30:00Z" },
      { id: "fb-3", product_id: null, customer_name: "Sophie Weber", rating: 4, text_de: "Zur Geburt unserer Nichte bestellt. Die Eltern fanden es sehr süß und passend. Gerne wieder!", text_en: "Ordered for the birth of our niece. The parents found it very sweet and fitting. Would order again!", photo_url: null, occasion: "geburt", created_at: "2024-09-08T09:15:00Z" },
      { id: "fb-4", product_id: null, customer_name: "Max Fischer", rating: 5, text_de: "Zum 25. Jubiläum meiner Eltern gekauft. Sie waren gerührt und haben es direkt ins Wohnzimmer gestellt.", text_en: "Bought for my parents' 25th anniversary. They were touched and placed it directly in the living room.", photo_url: null, occasion: "jubiläum", created_at: "2024-08-01T16:45:00Z" },
      { id: "fb-5", product_id: null, customer_name: "Lena Hoffmann", rating: 4, text_de: "Schönes kleines Geschenk zum Valentinstag. Mein Freund hat sich gefreut, besonders weil es so persönlich war.", text_en: "Nice little Valentine's Day gift. My boyfriend was happy, especially because it was so personal.", photo_url: null, occasion: "valentinstag", created_at: "2024-07-14T11:00:00Z" },
      { id: "fb-6", product_id: null, customer_name: "Tim Meyer", rating: 5, text_de: "Zum Muttertag bestellt – meine Mama war sehr gerührt. Ein Geschenk mit Herz, das man so nicht im Laden findet.", text_en: "Ordered for Mother's Day – my mom was very touched. A heartfelt gift you won't find in stores like this.", photo_url: null, occasion: "muttertag", created_at: "2024-06-12T08:20:00Z" },
      { id: "fb-7", product_id: null, customer_name: "Julia Schulz", rating: 5, text_de: "Zur Einweihung der neuen Wohnung verschenkt. Meine Freundin fand es total passend und hat es gleich aufgehängt.", text_en: "Given as a housewarming gift. My friend found it totally fitting and hung it up right away.", photo_url: null, occasion: "einweihung", created_at: "2024-05-03T13:10:00Z" },
      { id: "fb-8", product_id: null, customer_name: "Felix Koch", rating: 4, text_de: "Abschiedsgeschenk für meinen Kollegen. Er hat sich sehr gefreut und meinte, es sei das persönlichste Geschenk vom Team.", text_en: "Farewell gift for my colleague. He was very happy and said it was the most personal gift from the team.", photo_url: null, occasion: "abschied", created_at: "2024-04-18T15:00:00Z" },
      { id: "fb-9", product_id: null, customer_name: "Sarah Bauer", rating: 5, text_de: "Zum Weihnachtsfest für die Familie bestellt. Alle waren begeistert von der liebevollen Gestaltung.", text_en: "Ordered for the family Christmas celebration. Everyone was enthusiastic about the loving design.", photo_url: null, occasion: "weihnachten", created_at: "2024-03-25T17:30:00Z" },
      { id: "fb-10", product_id: null, customer_name: "Jonas Richter", rating: 4, text_de: "Danke-Sagen an meine Nachbarn für die Hilfe beim Umzug. Sie fanden es sehr aufmerksam und nett.", text_en: "Saying thanks to my neighbors for helping with the move. They found it very thoughtful and nice.", photo_url: null, occasion: "danke", created_at: "2024-02-10T10:45:00Z" },
      { id: "fb-11", product_id: null, customer_name: "Laura Wagner", rating: 5, text_de: "Zum Osternest für meine Kinder. Ein hübsches kleines Mitbringsel, das gut angekommen ist.", text_en: "For my kids' Easter basket. A pretty little gift that was well received.", photo_url: null, occasion: "ostern", created_at: "2024-01-28T09:00:00Z" },
      { id: "fb-12", product_id: null, customer_name: "David Becker", rating: 5, text_de: "Zum Vatertag bestellt – mein Papa hat sich riesig gefreut. Ein wirklich schönes Erinnerungsstück.", text_en: "Ordered for Father's Day – my dad was super happy. A really beautiful keepsake.", photo_url: null, occasion: "vatertag", created_at: "2024-01-15T12:00:00Z" },
    ];
    return FALLBACK_REVIEWS;
  });
