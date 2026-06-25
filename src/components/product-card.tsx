import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { ProductRow } from "@/lib/products.functions";
import { imageFor, secondaryImageFor } from "@/lib/product-images";
import { formatEUR, useT } from "@/i18n";
import { useWishlist } from "@/contexts/wishlist";

export function ProductCard({ p, eager }: { p: ProductRow; eager?: boolean }) {
  const { locale, t } = useT();
  const { has, toggle } = useWishlist();
  const liked = has(p.id);
  const name = locale === "de" ? p.name_de : p.name_en;
  const img = p.images?.[0] || imageFor(p.occasion);
  const img2 = secondaryImageFor(p.occasion);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link
        to="/shop/$slug"
        params={{ slug: p.slug }}
        className="block overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-border/60 transition-shadow duration-300 group-hover:shadow-[0_24px_50px_-24px_rgba(60,40,20,0.25)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-linen">
          <img
            src={img}
            alt={name}
            width={1024}
            height={1280}
            loading={eager ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <img
            src={img2}
            alt=""
            aria-hidden
            width={1024}
            height={1280}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />

          {p.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-walnut/90 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-cream">
              {p.badge === "bestseller" ? t("badge.bestseller") : t("badge.neu")}
            </span>
          )}
          <button
            type="button"
            aria-label="Wishlist"
            onClick={(e) => {
              e.preventDefault();
              toggle(p.id);
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-cream/90 text-walnut shadow-sm backdrop-blur transition hover:scale-110 active:scale-95"
          >
            <Heart size={16} className={liked ? "fill-destructive text-destructive" : ""} />
          </button>
        </div>
        <div className="space-y-1 px-4 py-4">
          <p className="eyebrow">{t(`occasions.${p.occasion}`)}</p>
          <h3 className="line-clamp-2 font-serif text-lg text-walnut">{name}</h3>
          <p className="pt-1 text-sm text-muted-foreground">
            <span className="opacity-70">{t("common.from")} </span>
            <span className="font-medium text-foreground">{formatEUR(p.base_price_cents, locale)}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}


export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
      <div className="aspect-[4/5] animate-pulse bg-linen" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-linen" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-linen" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-linen" />
      </div>
    </div>
  );
}
