import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { useCart } from "@/contexts/cart";
import { useWishlist } from "@/contexts/wishlist";
import logoAsset from "@/assets/diginutz-logo.jpeg.asset.json";

export function Header() {
  const { t, locale, setLocale } = useT();
  const { count } = useCart();
  const { ids } = useWishlist();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/shop", label: t("nav.shop") },
    { to: "/bewertungen", label: t("nav.reviews") },
    { to: "/ueber-uns", label: t("nav.about") },
    { to: "/kontakt", label: t("nav.contact") },
  ] as const;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? "bg-cream/85 shadow-[0_1px_0_rgba(60,40,20,0.06)] backdrop-blur" : "bg-cream/0"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-24 lg:px-10">
        <Link to="/" className="group flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="DigiNutz"
            className="h-14 w-14 rounded-full object-contain bg-cream transition group-hover:scale-105 lg:h-16 lg:w-16"
          />
          <span className="hidden font-serif text-2xl tracking-tight text-walnut sm:inline lg:text-3xl">
            Digi<span className="text-brass">Nutz</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative text-sm text-walnut/85 transition hover:text-walnut"
              activeProps={{ className: "text-walnut font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setLocale(locale === "de" ? "en" : "de")}
            aria-label="Sprache wechseln"
            className="hidden items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs uppercase tracking-widest text-walnut transition hover:bg-card sm:flex"
          >
            <span className={locale === "de" ? "text-walnut" : "text-muted-foreground"}>DE</span>
            <span className="text-muted-foreground">/</span>
            <span className={locale === "en" ? "text-walnut" : "text-muted-foreground"}>EN</span>
          </button>

          <Link
            to="/wunschliste"
            aria-label={t("nav.wishlist")}
            className="relative grid h-10 w-10 place-items-center rounded-full text-walnut transition hover:bg-linen"
          >
            <span aria-hidden="true" className="text-lg leading-none">♡</span>
            {ids.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brass px-1 text-[10px] font-medium text-walnut">
                {ids.length}
              </span>
            )}
          </Link>

          <Link
            to="/warenkorb"
            aria-label={t("nav.cart")}
            id="cart-icon"
            className="relative grid h-10 w-10 place-items-center rounded-full text-walnut transition hover:bg-linen"
          >
            <span aria-hidden="true" className="text-base leading-none">🛒</span>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-walnut px-1 text-[10px] font-medium text-cream"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full text-walnut transition hover:bg-linen lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/60 bg-cream/95 backdrop-blur lg:hidden"
          >
            <div className="mx-auto max-w-7xl px-6 py-4">
              <nav className="flex flex-col divide-y divide-border/50">
                {links.map((l) => (
                  <Link key={l.to} to={l.to} className="py-3 font-serif text-lg text-walnut">
                    {l.label}
                  </Link>
                ))}
              </nav>
              <button
                onClick={() => setLocale(locale === "de" ? "en" : "de")}
                className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-widest text-walnut"
              >
                <span className={locale === "de" ? "font-medium" : "opacity-50"}>Deutsch</span>
                <span className="opacity-30">/</span>
                <span className={locale === "en" ? "font-medium" : "opacity-50"}>English</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
