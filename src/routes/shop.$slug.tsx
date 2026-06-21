import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { getProductBySlug, listProducts } from "@/lib/products.functions";
import { listReviews } from "@/lib/reviews.functions";
import { formatEUR, useT } from "@/i18n";
import { useCart } from "@/contexts/cart";
import { useWishlist } from "@/contexts/wishlist";
import { imageFor, secondaryImageFor } from "@/lib/product-images";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { StarRating } from "@/components/star-rating";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData({
      queryKey: ["product", params.slug],
      queryFn: () => getProductBySlug({ data: { slug: params.slug } }),
    });
    if (!product) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["products"], queryFn: () => listProducts() }),
      context.queryClient.ensureQueryData({ queryKey: ["reviews", params.slug], queryFn: () => listReviews({ data: { limit: 12 } }) }),
    ]);
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return {};
    return {
      meta: [
        { title: `${p.name_de} | Lieblingsstück Atelier` },
        { name: "description", content: p.description_de.slice(0, 160) },
        { property: "og:title", content: p.name_de },
        { property: "og:description", content: p.description_de.slice(0, 160) },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/shop/${p.slug}` },
      ],
      links: [{ rel: "canonical", href: `/shop/${p.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name_de,
            description: p.description_de,
            offers: { "@type": "Offer", priceCurrency: "EUR", price: (p.base_price_cents / 100).toFixed(2) },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

const PRICE_BY_FORMAT: Record<string, number> = { A5: 0, A4: 500, A3: 1200 };
const PRICE_BY_MATERIAL: Record<string, number> = { karton: 0, holz: 800 };

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { t, locale } = useT();
  const navigate = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { data: reviews } = useSuspenseQuery({ queryKey: ["reviews", product.slug], queryFn: () => listReviews({ data: { limit: 12 } }) });
  const { data: all } = useSuspenseQuery({ queryKey: ["products"], queryFn: () => listProducts() });

  const name = locale === "de" ? product.name_de : product.name_en;
  const description = locale === "de" ? product.description_de : product.description_en;

  const formats = product.formats?.length ? product.formats : ["A5", "A4", "A3"];

  const [names, setNames] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<string>(formats[0]);
  const [material, setMaterial] = useState<string>(product.material);
  const [qty, setQty] = useState(1);

  const unitPrice =
    product.base_price_cents + (PRICE_BY_FORMAT[format] ?? 0) + (PRICE_BY_MATERIAL[material] ?? 0);

  const img = imageFor(product.occasion);
  const img2 = secondaryImageFor(product.occasion);
  const [activeImg, setActiveImg] = useState(img);

  const onAdd = () => {
    add({
      id: `${product.id}-${format}-${material}-${(names || "_")}-${(date || "_")}`,
      productId: product.id,
      slug: product.slug,
      name,
      image: img,
      unitPriceCents: unitPrice,
      qty,
      personalization: {
        names: names || undefined,
        date: date || undefined,
        message: message || undefined,
        format,
        material,
      },
    });
    toast.success(t("product.addedToCart"), { description: `${name} · ${format} · ${qty}×` });
  };

  const related = all.filter((p) => p.occasion === product.occasion && p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-walnut">Start</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-walnut">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-walnut">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.div
            key={activeImg}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative aspect-square overflow-hidden rounded-2xl bg-linen ring-1 ring-border"
          >
            <img src={activeImg} alt={name} width={1024} height={1024} className="h-full w-full object-cover" />
            {product.badge && (
              <span className="absolute left-4 top-4 rounded-full bg-walnut/90 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-cream">
                {product.badge === "bestseller" ? t("badge.bestseller") : t("badge.neu")}
              </span>
            )}
          </motion.div>
          <div className="mt-4 flex gap-3">
            {[img, img2].map((src) => (
              <button
                key={src}
                onClick={() => setActiveImg(src)}
                className={`relative aspect-square w-20 overflow-hidden rounded-lg ring-1 ${
                  activeImg === src ? "ring-2 ring-brass" : "ring-border"
                }`}
              >
                <img src={src} alt="" width={120} height={120} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">{t(`occasions.${product.occasion}`)}</p>
          <h1 className="mt-2 font-serif text-3xl text-walnut sm:text-4xl">{name}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <StarRating value={5} size={14} />
            <span>4,9 / 5 · {reviews.length} Bewertungen</span>
          </div>
          <p className="mt-6 text-base leading-relaxed text-foreground/85">{description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-3xl text-walnut">{formatEUR(unitPrice, locale)}</span>
            <span className="text-sm text-muted-foreground">inkl. MwSt. zzgl. Versand</span>
          </div>

          <div className="mt-8 space-y-5 rounded-2xl bg-card p-6 ring-1 ring-border/60">
            <Field label={t("product.name")}>
              <input
                type="text"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                placeholder={t("product.namePlaceholder")}
                maxLength={120}
                className="w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
            </Field>
            <Field label={t("product.date")}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
            </Field>
            <Field label={t("product.message")}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("product.messagePlaceholder")}
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("product.format")}>
                <div className="flex flex-wrap gap-2">
                  {formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`rounded-full border px-4 py-1.5 text-xs transition ${
                        format === f ? "border-walnut bg-walnut text-cream" : "border-border bg-cream text-walnut"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t("product.material")}>
                <div className="flex flex-wrap gap-2">
                  {(["karton", "holz"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMaterial(m)}
                      className={`rounded-full border px-4 py-1.5 text-xs transition ${
                        material === m ? "border-walnut bg-walnut text-cream" : "border-border bg-cream text-walnut"
                      }`}
                    >
                      {t(`shop.${m}`)}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border bg-card">
              <button aria-label="−" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-walnut">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button aria-label="+" onClick={() => setQty((q) => Math.min(50, q + 1))} className="grid h-11 w-11 place-items-center text-walnut">
                <Plus size={14} />
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onAdd}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-walnut px-6 py-3.5 text-sm font-medium text-cream transition hover:bg-walnut/90"
            >
              <ShoppingBag size={16} />
              {t("product.addToCart")} · {formatEUR(unitPrice * qty, locale)}
            </motion.button>
            <button
              onClick={() => toggle(product.id)}
              aria-label={t("nav.wishlist")}
              className={`grid h-12 w-12 place-items-center rounded-full border border-border bg-card transition ${
                has(product.id) ? "text-destructive" : "text-walnut hover:bg-linen"
              }`}
            >
              <Heart size={16} className={has(product.id) ? "fill-destructive" : ""} />
            </button>
          </div>

          <div className="mt-8 grid gap-3 text-sm">
            <Detail title={t("product.materials")} text={t("product.materialsText")} />
            <Detail title={t("product.delivery")} text={t("product.deliveryText")} />
          </div>
        </div>
      </div>

      <section className="mt-20">
        <Reveal>
          <h2 className="font-serif text-2xl text-walnut sm:text-3xl">{t("product.reviewsTitle")}</h2>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <div key={r.id} className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
              <StarRating value={r.rating} />
              <p className="mt-3 text-sm text-foreground/85">„{locale === "de" ? r.text_de : r.text_en}"</p>
              <p className="mt-3 text-xs font-medium text-walnut">{r.customer_name}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <Reveal>
            <h2 className="font-serif text-2xl text-walnut sm:text-3xl">{t("product.related")}</h2>
          </Reveal>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Detail({ title, text }: { title: string; text: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-walnut">
        {title} <ArrowRight size={14} className="transition group-open:rotate-90" />
      </summary>
      <p className="mt-3 text-muted-foreground">{text}</p>
    </details>
  );
}
