import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useT } from "@/i18n";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/contact.functions";

export function Footer() {
  const { t, locale } = useT();
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    try {
      await subscribe({ data: { email, locale } });
      setDone(true);
      setEmail("");
    } catch {
      setDone(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <footer className="mt-24 border-t border-border/60 bg-linen/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h3 className="font-serif text-3xl text-walnut">{t("newsletter.title")}</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("newsletter.text")}</p>
            <form onSubmit={onSubmit} className="mt-5 flex max-w-md gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletter.placeholder")}
                className="flex-1 rounded-full border border-border bg-cream px-5 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-brass"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-walnut px-6 py-3 text-sm font-medium text-cream transition hover:bg-walnut/90 active:scale-[0.98] disabled:opacity-60"
              >
                {t("newsletter.cta")}
              </button>
            </form>
            {done && <p className="mt-3 text-sm text-brass">{t("newsletter.success")}</p>}
          </div>

          <div className="lg:col-span-2">
            <h4 className="eyebrow">{t("nav.shop")}</h4>
            <ul className="mt-4 space-y-2 text-sm text-walnut/85">
              <li><Link to="/shop" className="hover:text-walnut">{t("shop.title")}</Link></li>
              <li><Link to="/bewertungen" className="hover:text-walnut">{t("nav.reviews")}</Link></li>
              <li><Link to="/wunschliste" className="hover:text-walnut">{t("nav.wishlist")}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="eyebrow">Atelier</h4>
            <ul className="mt-4 space-y-2 text-sm text-walnut/85">
              <li><Link to="/ueber-uns" className="hover:text-walnut">{t("nav.about")}</Link></li>
              <li><Link to="/kontakt" className="hover:text-walnut">{t("nav.contact")}</Link></li>
              <li><Link to="/faq" className="hover:text-walnut">FAQ</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="eyebrow">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-walnut/85">
              <li><Link to="/impressum" className="hover:text-walnut">{t("footer.legal.impressum")}</Link></li>
              <li><Link to="/agb" className="hover:text-walnut">{t("footer.legal.agb")}</Link></li>
              <li><Link to="/datenschutz" className="hover:text-walnut">{t("footer.legal.datenschutz")}</Link></li>
              <li><Link to="/widerruf" className="hover:text-walnut">{t("footer.legal.widerruf")}</Link></li>
              <li><Link to="/versand" className="hover:text-walnut">{t("footer.legal.versand")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="gold-divider my-12" />

        <div className="flex flex-col items-center justify-between gap-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brass/15 px-3 py-1 text-xs uppercase tracking-widest text-walnut">
              {t("footer.handmade")}
            </span>
            <span>© {new Date().getFullYear()} DigiNutz. {t("footer.rights")}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden text-xs uppercase tracking-widest md:inline">{t("contact.follow")}</span>
            <a href="https://www.instagram.com/digi.nutz?igsh=d2MzZXU1ZTNqZnpl" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-walnut hover:text-brass"><Instagram size={18} /></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-walnut hover:text-brass"><Facebook size={18} /></a>
            <a href="https://wa.me/4915112345678" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-walnut hover:text-brass"><MessageCircle size={18} /></a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 opacity-70">
          {["PayPal", "Stripe", "Visa", "Mastercard", "Apple Pay", "Google Pay", "Klarna"].map((p) => (
            <span key={p} className="rounded-md border border-border bg-card px-3 py-1 text-[11px] font-medium tracking-wide text-walnut/80">
              {p}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
