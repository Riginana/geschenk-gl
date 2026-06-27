import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, Heart, Package, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-frame.jpg";
import atelierImg from "@/assets/atelier.jpg";
import featuredWedding from "@/assets/featured-wedding.webp.asset.json";
import featuredAdventure from "@/assets/featured-adventure.webp.asset.json";
import featuredController from "@/assets/featured-controller.jpg.asset.json";
import { useT } from "@/i18n";
import { listProducts } from "@/lib/products.functions";
import { listReviews } from "@/lib/reviews.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { StarRating } from "@/components/star-rating";
import { imageFor } from "@/lib/product-images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DigiNutz — Personalisierte Geldgeschenke" },
      {
        name: "description",
        content:
          "Handgefertigte personalisierte Geldgeschenke aus Holz & Papier — für Hochzeit, Geburtstag, Geburt und mehr. Mit Namen und Datum personalisiert.",
      },
      { property: "og:title", content: "DigiNutz — Personalisierte Geldgeschenke" },
      { property: "og:description", content: "Handgefertigt in Deutschland. Mit Liebe zum Detail." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["products"], queryFn: () => listProducts() }),
      context.queryClient.ensureQueryData({ queryKey: ["reviews", "home"], queryFn: () => listReviews({ data: { limit: 12 } }) }),
    ]);
  },
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <FeaturedTrio />
      <HowItWorks />
      <Occasions />
      <Bestsellers />
      <ReviewsBlock />
      <Atelier />
      <TrustStrip />
    </>
  );
}

function Hero() {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <section ref={ref} className="paper-grain relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
        <motion.div style={{ opacity: fade }} className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow"
          >
            {t("hero.eyebrow")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 font-serif text-4xl leading-[1.05] text-walnut sm:text-5xl lg:text-7xl"
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg"
          >
            {t("hero.sub")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-walnut px-7 py-3.5 text-sm font-medium text-cream transition hover:bg-walnut/90 active:scale-[0.98]"
            >
              {t("hero.cta")}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-walnut/20 px-7 py-3.5 text-sm font-medium text-walnut transition hover:bg-walnut/5"
            >
              {t("hero.ctaSecondary")}
            </a>
          </motion.div>

          <div className="mt-10 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <StarRating value={5} size={16} />
              <span className="text-sm text-muted-foreground">4,9 / 5 · 3.247 Bewertungen</span>
            </div>
          </div>
        </motion.div>

        <motion.div style={{ y }} className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-brass/10 blur-2xl" aria-hidden />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[1.5rem] shadow-[0_40px_80px_-30px_rgba(60,40,20,0.35)] ring-1 ring-walnut/10"
          >
            <img
              src={heroImg}
              alt="Personalisiertes Geldgeschenk in einem Eichenrahmen"
              width={1600}
              height={1200}
              className="block h-auto w-full"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="absolute -bottom-6 left-6 hidden rounded-2xl bg-card px-5 py-4 shadow-xl ring-1 ring-border md:block"
          >
            <p className="eyebrow">Handgefertigt</p>
            <p className="mt-1 font-serif text-lg text-walnut">in Eichenholz & Papier</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedTrio() {
  const { t } = useT();
  const items = [
    { src: featuredWedding.url, alt: "Personalisierter Holzteller zur Hochzeit", aspect: "aspect-[4/5]" },
    { src: featuredAdventure.url, alt: "Geldgeschenk im Eichenrahmen zum Geburtstag", aspect: "aspect-[4/3]" },
    { src: featuredController.url, alt: "Geldgeschenk in Form eines Gaming-Controllers aus Holz", aspect: "aspect-[4/3]" },
  ];

  return (
    <section className="border-t border-border/60 bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t("featured.eyebrow")}</p>
            <h2 className="mt-3 font-serif text-3xl text-walnut sm:text-4xl lg:text-5xl">
              {t("featured.title")}
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3 md:grid-rows-2 md:gap-6">
          <Reveal>
            <a
              href="/shop"
              className={`group relative block ${items[0].aspect} overflow-hidden rounded-[1.5rem] ring-1 ring-walnut/10 shadow-[0_24px_50px_-30px_rgba(60,40,20,0.3)] md:col-span-2 md:row-span-2 md:h-full md:aspect-auto`}
            >
              <img
                src={items[0].src}
                alt={items[0].alt}
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-walnut/40 to-transparent" aria-hidden />
            </a>
          </Reveal>

          {items.slice(1).map((it, i) => (
            <Reveal key={i} delay={(i + 1) * 0.08}>
              <a
                href="/shop"
                className={`group relative block ${it.aspect} overflow-hidden rounded-[1.5rem] ring-1 ring-walnut/10 shadow-[0_24px_50px_-30px_rgba(60,40,20,0.3)] md:h-full md:aspect-auto`}
              >
                <img
                  src={it.src}
                  alt={it.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-walnut/40 to-transparent" aria-hidden />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}



function HowItWorks() {
  const { t } = useT();
  const steps = (t("how.steps") as unknown as { title: string; text: string }[]) ?? [];
  const icons = [Sparkles, Heart, Package];

  return (
    <section id="how" className="border-y border-border/60 bg-linen/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t("how.eyebrow")}</p>
            <h2 className="mt-3 font-serif text-3xl text-walnut sm:text-4xl lg:text-5xl">{t("how.title")}</h2>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={i} delay={i * 0.08}>
                <div className="group relative h-full rounded-2xl bg-card p-8 ring-1 ring-border/60 transition hover:shadow-[0_24px_50px_-30px_rgba(60,40,20,0.25)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brass/15 text-walnut transition group-hover:bg-brass/25">
                    <Icon size={22} strokeWidth={1.6} />
                  </div>
                  <div className="mt-6 flex items-baseline gap-3">
                    <span className="font-serif text-3xl text-brass">{(i + 1).toString().padStart(2, "0")}</span>
                    <h3 className="font-serif text-2xl text-walnut">{s.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Occasions() {
  const { t } = useT();
  const { data: products } = useSuspenseQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const items = [
    "hochzeit",
    "geburtstag",
    "geburt",
    "taufe",
    "konfirmation",
    "abitur",
    "ruhestand",
    "weihnachten",
    "einzug",
  ] as const;

  const pickImage = (occasion: string, idx: number) => {
    const matches = products.filter((p) => p.occasion === occasion && p.images?.[0]);
    if (matches.length > 0) return matches[idx % matches.length].images[0];
    return imageFor(occasion);
  };



  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <Reveal>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{t("occasions.eyebrow")}</p>
            <h2 className="mt-3 font-serif text-3xl text-walnut sm:text-4xl lg:text-5xl">{t("occasions.title")}</h2>
          </div>
          <Link to="/shop" className="hidden text-sm font-medium text-walnut underline-offset-4 hover:underline sm:inline-flex">
            {t("shop.title")} →
          </Link>
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 lg:gap-6">
        {items.map((o, i) => (
          <Reveal key={o} delay={(i % 3) * 0.05}>
            <Link
              to="/shop"
              search={{ occasion: o } as any}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-border/60"
            >
              <img
                src={pickImage(o, i)}
                alt={t(`occasions.${o}`)}
                loading="lazy"
                width={800}
                height={1000}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-walnut/80 via-walnut/10 to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="eyebrow text-cream/80">Anlass</p>
                <h3 className="mt-1 font-serif text-2xl text-cream">{t(`occasions.${o}`)}</h3>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Bestsellers() {
  const { t } = useT();
  const { data: products } = useSuspenseQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const best = products.filter((p) => p.badge === "bestseller").slice(0, 4);

  return (
    <section className="border-t border-border/60 bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t("bestsellers.eyebrow")}</p>
            <h2 className="mt-3 font-serif text-3xl text-walnut sm:text-4xl lg:text-5xl">{t("bestsellers.title")}</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {best.length === 0
            ? [0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)
            : best.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.05}>
                  <ProductCard p={p} />
                </Reveal>
              ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsBlock() {
  const { t, locale } = useT();
  const { data: reviews } = useSuspenseQuery({ queryKey: ["reviews", "home"], queryFn: () => listReviews({ data: { limit: 12 } }) });
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });

  return (
    <section className="border-y border-border/60 bg-linen/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <p className="eyebrow">{t("reviews.eyebrow")}</p>
            <h2 className="mt-3 font-serif text-3xl text-walnut sm:text-4xl lg:text-5xl">{t("reviews.title")}</h2>
            <div className="mt-4 flex items-center gap-3">
              <StarRating value={5} size={18} />
              <span className="text-sm text-muted-foreground">4,9 / 5 · 3.247 Bewertungen</span>
            </div>
          </div>
        </Reveal>
        <div className="mt-12 overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {reviews.map((r) => (
              <div key={r.id} className="min-w-[280px] max-w-[340px] flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%]">
                <div className="h-full rounded-2xl bg-card p-6 ring-1 ring-border/60">
                  <StarRating value={r.rating} size={14} />
                  <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                    „{locale === "de" ? r.text_de : r.text_en}"
                  </p>
                  <p className="mt-5 text-sm font-medium text-walnut">{r.customer_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/bewertungen"
            className="inline-flex items-center gap-2 rounded-full border border-walnut/20 px-6 py-3 text-sm font-medium text-walnut hover:bg-walnut/5"
          >
            {t("reviews.seeAll")} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Atelier() {
  const { t } = useT();
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[1.5rem] shadow-xl ring-1 ring-border">
          <img src={atelierImg} alt="Unsere Werkstatt" loading="lazy" width={1400} height={1000} className="block h-auto w-full" />
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div>
          <p className="eyebrow">{t("atelier.eyebrow")}</p>
          <h2 className="mt-3 font-serif text-3xl text-walnut sm:text-4xl lg:text-5xl">{t("atelier.title")}</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{t("atelier.text")}</p>
          <Link
            to="/ueber-uns"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-walnut px-6 py-3 text-sm font-medium text-cream hover:bg-walnut/90"
          >
            {t("atelier.cta")} <ArrowRight size={14} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-t border-border/60 bg-walnut text-cream">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-10">
        {[
          { kpi: "3.247+", label: "zufriedene Kunden" },
          { kpi: "4,9 ★", label: "durchschnittliche Bewertung" },
          { kpi: "100 %", label: "Handarbeit in Deutschland" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-serif text-4xl text-brass-soft">{s.kpi}</p>
            <p className="mt-1 text-sm uppercase tracking-widest text-cream/70">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
