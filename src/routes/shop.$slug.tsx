import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Heart, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { products } from "@/data/products";
import { formatEUR, useT } from "@/i18n";
import { useCart } from "@/contexts/cart";
import { useWishlist } from "@/contexts/wishlist";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/shop/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return {};
    return {
      meta: [
        { title: `${p.title} | DigiNutz` },
        { name: "description", content: p.description.slice(0, 160) },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.description.slice(0, 160) },
        { property: "og:image", content: p.image },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/shop/${p.id}` },
      ],
      links: [{ rel: "canonical", href: `/shop/${p.id}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title,
            description: p.description,
            image: p.image,
            offers: {
              "@type": "Offer",
              priceCurrency: "EUR",
              price: p.price.toFixed(2),
              availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: ProductNotFound,
});

function detectFormats(text: string): Array<"A5" | "A4" | "A3"> {
  const out: Array<"A5" | "A4" | "A3"> = [];
  const t = text.toUpperCase();
  for (const f of ["A5", "A4", "A3"] as const) {
    if (new RegExp(`\\b${f}\\b`).test(t) || t.includes(`DIN ${f}`)) out.push(f);
  }
  return out;
}

const FRAMES = ["holz", "papier", "kraftpapier"] as const;
const PRICE_BY_FORMAT: Record<string, number> = { A5: 0, A4: 5, A3: 12 };
const PRICE_BY_FRAME: Record<string, number> = { papier: 0, kraftpapier: 2, holz: 8 };

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { t, locale } = useT();
  const navigate = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();

  const formats = useMemo(() => {
    const f = detectFormats(`${product.title} ${product.description}`);
    return f.length ? f : (["A5", "A4", "A3"] as const).slice();
  }, [product]);

  const [format, setFormat] = useState<string>(formats[0]);
  const [frame, setFrame] = useState<string>(product.material || "holz");
  const [qty, setQty] = useState(1);

  const unitPrice = product.price + (PRICE_BY_FORMAT[format] ?? 0) + (PRICE_BY_FRAME[frame] ?? 0);
  const unitCents = Math.round(unitPrice * 100);

  const onAdd = () => {
    add({
      id: `${product.id}-${format}-${frame}`,
      productId: product.id,
      slug: product.id,
      name: product.title,
      image: product.image,
      unitPriceCents: unitCents,
      qty,
      personalization: { format, material: frame },
    });
    toast.success(t("product.addedToCart"), { description: `${product.title.slice(0, 60)} · ${format} · ${qty}×` });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-walnut">Start</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-walnut">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-walnut line-clamp-1">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-linen ring-1 ring-border">
            <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
            <span className="absolute left-4 top-4 rounded-full bg-walnut/90 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-cream">
              {t(`occasions.${product.occasion}`) || product.occasion}
            </span>
          </div>
        </Reveal>

        <div>
          <p className="eyebrow">{t(`occasions.${product.occasion}`) || product.occasion}</p>
          <h1 className="mt-2 font-serif text-3xl text-walnut sm:text-4xl">{product.title}</h1>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-3xl text-walnut">{formatEUR(unitCents, locale)}</span>
            <span className="text-sm text-muted-foreground">inkl. MwSt. zzgl. Versand</span>
          </div>

          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground/85">
            {product.description}
          </p>

          <div className="mt-8 space-y-5 rounded-2xl bg-card p-6 ring-1 ring-border/60">
            <div>
              <p className="eyebrow mb-2">{t("product.format")}</p>
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
            </div>
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
    </div>
  );
}

function ProductNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-6xl text-walnut">404</h1>
      <h2 className="mt-4 font-serif text-2xl text-walnut">Produkt nicht gefunden</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Dieses Produkt existiert nicht oder wurde entfernt.
      </p>
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
