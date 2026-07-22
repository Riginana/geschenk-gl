import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { listProducts, type ProductRow } from "@/lib/products.functions";
import { listReviews } from "@/lib/reviews.functions";
import { formatEUR, formatDate, useT } from "@/i18n";
import { useCart } from "@/contexts/cart";
import { useWishlist } from "@/contexts/wishlist";
import { Reveal } from "@/components/reveal";
import { StarRating } from "@/components/star-rating";

const productsQueryOptions = {
  queryKey: ["products"] as const,
  queryFn: () => listProducts(),
};

const FRAMES = ["holz", "papier", "kraftpapier"] as const;
import { PRICE_BY_FORMAT_CENTS, PRICE_BY_FRAME_CENTS, withPromo } from "@/lib/pricing";


function detectFormats(text: string): Array<"A5" | "A4" | "A3"> {
  const out: Array<"A5" | "A4" | "A3"> = [];
  const t = text.toUpperCase();
  for (const f of ["A5", "A4", "A3"] as const) {
    if (new RegExp(`\\b${f}\\b`).test(t) || t.includes(`DIN ${f}`)) out.push(f);
  }
  return out;
}

export const Route = createFileRoute("/product/$id")({
  loader: async ({ context, params }) => {
    const products = await context.queryClient.ensureQueryData(productsQueryOptions);
    const product = products.find((p) => p.id === params.id || p.slug === params.id);
    if (!product) throw notFound();
    return { id: product.id, product };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) return {};
    const image = product.images?.[0] ?? "";
    return {
      meta: [
        { title: `${product.name_de} | DigiNutz` },
        { property: "og:title", content: product.name_de },
        { property: "og:type", content: "product" },
        ...(image ? [{ property: "og:image", content: image }] : []),
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: ProductNotFound,
});

function ProductPage() {
  const { id } = Route.useLoaderData();
  const { t, locale } = useT();
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const product = products.find((p) => p.id === id) as ProductRow | undefined;

  const { add } = useCart();
  const { has, toggle } = useWishlist();

  const title = product ? (locale === "de" ? product.name_de : product.name_en) : "";
  const description = product ? (locale === "de" ? product.description_de : product.description_en) : "";
  const images = product?.images ?? [];

  const formats = useMemo(() => {
    if (!product) return ["A5", "A4", "A3"] as Array<"A5" | "A4" | "A3">;
    const fromDb = (product.formats ?? []).filter((f): f is "A5" | "A4" | "A3" =>
      f === "A5" || f === "A4" || f === "A3",
    );
    if (fromDb.length) return fromDb;
    const detected = detectFormats(`${title} ${description}`);
    return detected.length ? detected : (["A5", "A4", "A3"] as Array<"A5" | "A4" | "A3">);
  }, [product, title, description]);

  const [format, setFormat] = useState<string>(formats[0]);
  const [frame, setFrame] = useState<string>(product?.material || "holz");
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [persName, setPersName] = useState("");
  const [persDate, setPersDate] = useState("");
  const [persText, setPersText] = useState("");

  if (!product) return <ProductNotFound />;

  const image = images[activeImage] ?? images[0] ?? "";
  const basePrice = product.base_price_cents / 100;
  const unitPrice = basePrice + (PRICE_BY_FORMAT[format] ?? 0) + (PRICE_BY_FRAME[frame] ?? 0);
  const unitCents = Math.round(unitPrice * 100);

  const onAdd = () => {
    add({
      id: `${product.id}-${format}-${frame}-${persName}-${persDate}`.slice(0, 200),
      productId: product.id,
      slug: product.slug,
      name: title,
      image,
      unitPriceCents: unitCents,
      qty,
      personalization: { format, material: frame, names: persName, date: persDate, message: persText },
    });
    toast.success(t("product.addedToCart"), { description: `${title.slice(0, 60)} · ${format} · ${qty}×` });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-walnut">Start</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-walnut">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-walnut line-clamp-1">{title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-linen ring-1 ring-border">
              <img src={image} alt={title} className="h-full w-full object-cover" />
              <span className="absolute left-4 top-4 rounded-full bg-walnut/90 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-cream">
                {t(`occasions.${product.occasion}`) || product.occasion}
              </span>
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`${title} — ${i + 1}`}
                    aria-current={i === activeImage}
                    className={`relative aspect-square overflow-hidden rounded-lg bg-linen ring-1 transition ${
                      i === activeImage ? "ring-2 ring-walnut" : "ring-border hover:ring-walnut/50"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <div>
          <p className="eyebrow">{t(`occasions.${product.occasion}`) || product.occasion}</p>
          <h1 className="mt-2 font-serif text-3xl text-walnut sm:text-4xl">{title}</h1>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-3xl text-walnut">{formatEUR(unitCents, locale)}</span>
            <span className="text-sm text-muted-foreground">inkl. MwSt. zzgl. Versand</span>
          </div>

          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/85">{description}</p>

          <div className="mt-8 space-y-5 rounded-2xl bg-card p-6 ring-1 ring-border/60">
            {formats.length > 1 && (
              <div>
                <p className="eyebrow mb-2">{t("product.format")}</p>
                <div role="radiogroup" aria-label={t("product.format")} className="flex flex-wrap gap-2">
                  {formats.map((f) => (
                    <button
                      key={f}
                      role="radio"
                      aria-checked={format === f}
                      onClick={() => setFormat(f)}
                      className={`rounded-full border px-4 py-1.5 text-xs transition ${
                        format === f ? "border-walnut bg-walnut text-cream" : "border-border bg-cream text-walnut"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="eyebrow mb-2">{t("product.material")}</p>
              <div className="flex flex-wrap gap-2">
                {FRAMES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFrame(m)}
                    className={`rounded-full border px-4 py-1.5 text-xs transition ${
                      frame === m ? "border-walnut bg-walnut text-cream" : "border-border bg-cream text-walnut"
                    }`}
                  >
                    {t(`shop.${m}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl bg-card p-6 ring-1 ring-border/60">
            <p className="eyebrow">Personalisierung</p>
            <label className="block">
              <span className="text-xs text-muted-foreground">Name(n)</span>
              <input
                type="text"
                value={persName}
                onChange={(e) => setPersName(e.target.value)}
                maxLength={80}
                placeholder="z. B. Julia & Max"
                className="mt-1.5 w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Datum (optional)</span>
              <input
                type="text"
                value={persDate}
                onChange={(e) => setPersDate(e.target.value)}
                maxLength={40}
                placeholder="z. B. 24.12.2026"
                className="mt-1.5 w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Wunschtext (optional)</span>
              <textarea
                rows={3}
                value={persText}
                onChange={(e) => setPersText(e.target.value)}
                maxLength={400}
                placeholder="Persönliche Widmung, Grußworte…"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
              />
            </label>
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
              {t("product.addToCart")} · {formatEUR(unitCents * qty, locale)}
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

          {product.tags?.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.slice(0, 10).map((tag: string) => (
                  <span key={tag} className="rounded-full bg-linen px-3 py-1 text-xs text-muted-foreground">
                    {tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} occasion={product.occasion} />
    </div>
  );
}

function ProductReviews({ productId, occasion }: { productId: string; occasion: string }) {
  const { t, locale } = useT();
  const { data: reviews } = useSuspenseQuery({
    queryKey: ["reviews", "product", productId, occasion],
    queryFn: () => listReviews({ data: { productId, occasion, limit: 12 } }).catch(() => []),
  });
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <section className="mt-16 border-t border-border pt-12">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t("reviews.eyebrow")}</p>
            <h2 className="mt-2 font-serif text-2xl text-walnut sm:text-3xl">
              {avg.toFixed(1).replace(".", ",")} <span className="text-brass">★</span>
              <span className="ml-2 text-sm font-sans text-muted-foreground">({reviews.length})</span>
            </h2>
          </div>
          <Link to="/bewertungen" className="text-sm text-walnut underline underline-offset-4 hover:text-brass">
            {t("reviews.seeAll")}
          </Link>
        </div>
      </Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 6).map((r, i) => (
          <Reveal key={r.id} delay={(i % 6) * 0.04}>
            <article className="h-full rounded-2xl bg-card p-6 ring-1 ring-border/60">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} />
                <time className="text-xs text-muted-foreground">{formatDate(r.created_at, locale)}</time>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                „{locale === "de" ? r.text_de : r.text_en}"
              </p>
              <div className="mt-4 text-xs font-medium text-walnut">{r.customer_name}</div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ProductNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-6xl text-walnut">404</h1>
      <h2 className="mt-4 font-serif text-2xl text-walnut">Produkt nicht gefunden</h2>
      <p className="mt-2 text-sm text-muted-foreground">Dieses Produkt existiert nicht oder wurde entfernt.</p>
      <Link
        to="/shop"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-walnut px-5 py-2.5 text-sm font-medium text-cream hover:bg-walnut/90"
      >
        <ArrowLeft size={14} />
        Zurück zum Shop
      </Link>
    </div>
  );
}
