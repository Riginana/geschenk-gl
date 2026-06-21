import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatEUR, useT } from "@/i18n";
import { useCart } from "@/contexts/cart";

export const Route = createFileRoute("/warenkorb")({
  head: () => ({
    meta: [
      { title: "Warenkorb | DigiNutz" },
      { name: "description", content: "Ihr Warenkorb bei DigiNutz." },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "/warenkorb" },
    ],
    links: [{ rel: "canonical", href: "/warenkorb" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, locale } = useT();
  const { items, remove, update, subtotalCents, count } = useCart();
  const shipping = subtotalCents >= 5000 || subtotalCents === 0 ? 0 : 490;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
      <h1 className="font-serif text-4xl text-walnut sm:text-5xl">{t("cart.title")}</h1>

      {count === 0 ? (
        <div className="mt-10 rounded-2xl bg-linen px-6 py-20 text-center">
          <p className="text-lg text-muted-foreground">{t("cart.empty")}</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-walnut px-6 py-3 text-sm font-medium text-cream hover:bg-walnut/90">
            {t("cart.continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <ul className="lg:col-span-2 space-y-4">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <motion.li
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-4 rounded-2xl bg-card p-4 ring-1 ring-border/60"
                >
                  <img src={it.image} alt={it.name} width={120} height={120} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to="/shop/$slug" params={{ slug: it.slug }} className="line-clamp-2 font-serif text-lg text-walnut hover:underline">
                          {it.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {it.personalization.format} · {t(`shop.${it.personalization.material}`)}
                          {it.personalization.names ? ` · „${it.personalization.names}"` : ""}
                          {it.personalization.date ? ` · ${it.personalization.date}` : ""}
                        </p>
                      </div>
                      <button onClick={() => remove(it.id)} aria-label={t("cart.remove")} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => update(it.id, it.qty - 1)} aria-label="−" className="grid h-9 w-9 place-items-center text-walnut">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm">{it.qty}</span>
                        <button onClick={() => update(it.id, it.qty + 1)} aria-label="+" className="grid h-9 w-9 place-items-center text-walnut">
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="font-medium">{formatEUR(it.qty * it.unitPriceCents, locale)}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="h-fit rounded-2xl bg-linen/60 p-6 ring-1 ring-border">
            <div className="space-y-3 text-sm">
              <Row label={t("cart.subtotal")} value={formatEUR(subtotalCents, locale)} />
              <Row label={t("cart.shipping")} value={shipping === 0 ? "Kostenlos" : formatEUR(shipping, locale)} />
              <div className="gold-divider my-3" />
              <Row label={t("cart.total")} value={formatEUR(subtotalCents + shipping, locale)} big />
            </div>
            <Link
              to="/kasse"
              className="mt-6 block w-full rounded-full bg-walnut px-6 py-3.5 text-center text-sm font-medium text-cream hover:bg-walnut/90"
            >
              {t("cart.checkout")}
            </Link>
            <Link to="/shop" className="mt-3 block text-center text-sm text-walnut hover:underline">
              {t("cart.continueShopping")}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? "text-base font-medium text-walnut" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={big ? "font-serif text-xl" : ""}>{value}</span>
    </div>
  );
}
