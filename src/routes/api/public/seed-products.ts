import { createFileRoute } from "@tanstack/react-router";
import raw from "@/data/etsy-products.json";

type RawEtsy = {
  id: string;
  title: string;
  description: string;
  price: number;
  occasion: string;
  material?: string;
  image: string;
};

function detectFormats(text: string): string[] {
  const t = text.toUpperCase();
  const found = ["A5", "A4", "A3"].filter(
    (f) => new RegExp(`\\b${f}\\b`).test(t) || t.includes(`DIN ${f}`),
  );
  return found.length ? found : ["A4"];
}

export const Route = createFileRoute("/api/public/seed-products")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-seed-token");
        if (!token || token !== process.env.SEED_TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const rows = (raw as RawEtsy[]).map((p, i) => ({
          slug: p.id,
          name_de: p.title,
          name_en: p.title,
          description_de: p.description,
          description_en: p.description,
          base_price_cents: Math.round(p.price * 100),
          occasion: p.occasion,
          material: p.material ?? "karton",
          formats: detectFormats(`${p.title} ${p.description}`),
          images: [p.image],
          badge: i < 8 ? "bestseller" : i < 16 ? "neu" : null,
          is_active: true,
        }));
        const { error, count } = await supabaseAdmin
          .from("products")
          .upsert(rows, { onConflict: "slug", count: "exact" });
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(
          JSON.stringify({ ok: true, inserted: count ?? rows.length }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
