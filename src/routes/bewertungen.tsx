import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useT } from "@/i18n";
import { StarRating } from "@/components/star-rating";
import { Reveal } from "@/components/reveal";
import { averageRating, customerReviews, ratingDistribution, reviewCount } from "@/data/reviews";

const PAGE_SIZE = 12;

function fmt(n: number) {
  return n.toFixed(1).replace(".", ",");
}

function formatReviewDate(iso: string, locale: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "DigiNutz — Personalisierte Geldgeschenke",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: averageRating,
    reviewCount,
    bestRating: 5,
    worstRating: 1,
  },
  review: customerReviews.slice(0, PAGE_SIZE).map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.name },
    datePublished: r.date,
    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    reviewBody: r.text,
  })),
};

export const Route = createFileRoute("/bewertungen")({
  head: () => ({
    meta: [
      { title: `Bewertungen — ${fmt(averageRating)}★ aus ${reviewCount} Kundenstimmen | DigiNutz` },
      {
        name: "description",
        content: `${reviewCount} echte Kundenbewertungen mit ${fmt(
          averageRating,
        )} von 5 Sternen zu unseren handgefertigten personalisierten Geldgeschenken.`,
      },
      { property: "og:title", content: "Bewertungen unserer Kunden — DigiNutz" },
      {
        property: "og:description",
        content: `${fmt(averageRating)} von 5 Sternen aus ${reviewCount} echten Bewertungen.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/bewertungen" },
    ],
    links: [{ rel: "canonical", href: "/bewertungen" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { t, locale } = useT();
  const [filter, setFilter] = useState<number | "all">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () => (filter === "all" ? customerReviews : customerReviews.filter((r) => r.rating === filter)),
    [filter],
  );

  const shown = filtered.slice(0, visible);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow">{t("reviews.eyebrow")}</p>
          <h1 className="mt-2 font-serif text-4xl text-walnut sm:text-6xl">
            {fmt(averageRating)} <span className="text-brass">★</span>
          </h1>
          <div className="mt-3 flex justify-center">
            <StarRating value={averageRating} size={20} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {reviewCount} {locale === "en" ? "reviews" : "Bewertungen"}
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-card p-6 ring-1 ring-border/60">
          {ratingDistribution.map((d) => (
            <div key={d.stars} className="flex items-center gap-3 py-1.5">
              <span className="w-10 shrink-0 text-xs text-walnut">{d.stars} ★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-walnut/10">
                <div className="h-full rounded-full bg-brass" style={{ width: `${d.percent}%` }} />
              </div>
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                {Math.round(d.percent)}% ({d.count})
              </span>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => {
            setFilter("all");
            setVisible(PAGE_SIZE);
          }}
          className={`rounded-full border px-4 py-1.5 text-xs transition ${
            filter === "all" ? "border-walnut bg-walnut text-cream" : "border-border bg-card text-walnut"
          }`}
        >
          {t("shop.all")} ({reviewCount})
        </button>
        {ratingDistribution.map((d) => (
          <button
            key={d.stars}
            onClick={() => {
              setFilter(d.stars);
              setVisible(PAGE_SIZE);
            }}
            className={`rounded-full border px-4 py-1.5 text-xs transition ${
              filter === d.stars ? "border-walnut bg-walnut text-cream" : "border-border bg-card text-walnut"
            }`}
          >
            {d.stars}★ ({d.count})
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((r, i) => (
          <Reveal key={r.id} delay={(i % 6) * 0.04}>
            <article className="h-full rounded-2xl bg-card p-6 ring-1 ring-border/60">
              <div className="flex items-center justify-between gap-3">
                <StarRating value={r.rating} />
                <time dateTime={r.date} className="text-xs text-muted-foreground">
                  {formatReviewDate(r.date, locale)}
                </time>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">„{r.text}“</p>
              <p className="mt-4 text-xs font-medium text-walnut">{r.name}</p>
            </article>
          </Reveal>
        ))}
      </div>

      {visible < filtered.length && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-full border border-walnut/20 px-6 py-3 text-sm font-medium text-walnut transition hover:bg-walnut/5"
          >
            {locale === "en" ? "Show more reviews" : "Weitere Bewertungen anzeigen"}
          </button>
        </div>
      )}
    </div>
  );
}
