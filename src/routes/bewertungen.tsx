import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listReviews } from "@/lib/reviews.functions";
import { useT, formatDate } from "@/i18n";
import { StarRating } from "@/components/star-rating";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/bewertungen")({
  head: () => ({
    meta: [
      { title: "Bewertungen unserer Kunden | DigiNutz" },
      {
        name: "description",
        content:
          "Über 3.000 zufriedene Kunden — lesen Sie echte Bewertungen zu unseren handgefertigten Geldgeschenken.",
      },
      { property: "og:title", content: "Bewertungen unserer Kunden" },
      { property: "og:url", content: "/bewertungen" },
    ],
    links: [{ rel: "canonical", href: "/bewertungen" }],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["reviews", "all"],
      queryFn: () => listReviews({ data: { limit: 100 } }),
    }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { t, locale } = useT();
  const { data: reviews } = useSuspenseQuery({
    queryKey: ["reviews", "all"],
    queryFn: () => listReviews({ data: { limit: 300 } }),
  });
  const [occasion, setOccasion] = useState<string>("all");

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const filtered = occasion === "all" ? reviews : reviews.filter((r) => r.occasion === occasion);

  const occasions = useMemo(() => {
    const s = new Set<string>();
    reviews.forEach((r) => r.occasion && s.add(r.occasion));
    return Array.from(s);
  }, [reviews]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow">{t("reviews.eyebrow")}</p>
          <h1 className="mt-2 font-serif text-4xl text-walnut sm:text-6xl">
            {avg.toFixed(1).replace(".", ",")} <span className="text-brass">★</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{reviews.length} Bewertungen</p>
        </div>
      </Reveal>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setOccasion("all")}
          className={`rounded-full border px-4 py-1.5 text-xs ${
            occasion === "all" ? "border-walnut bg-walnut text-cream" : "border-border bg-card text-walnut"
          }`}
        >
          {t("shop.all")}
        </button>
        {occasions.map((o) => (
          <button
            key={o}
            onClick={() => setOccasion(o)}
            className={`rounded-full border px-4 py-1.5 text-xs ${
              occasion === o ? "border-walnut bg-walnut text-cream" : "border-border bg-card text-walnut"
            }`}
          >
            {t(`occasions.${o}`)}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r, i) => (
          <Reveal key={r.id} delay={(i % 6) * 0.04}>
            <article className="h-full rounded-2xl bg-card p-6 ring-1 ring-border/60">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                <time className="text-xs text-muted-foreground">{formatDate(r.created_at, locale)}</time>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                „{locale === "de" ? r.text_de : r.text_en}"
              </p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-medium text-walnut">{r.customer_name}</span>
                {r.occasion && <span className="text-muted-foreground">{t(`occasions.${r.occasion}`)}</span>}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
