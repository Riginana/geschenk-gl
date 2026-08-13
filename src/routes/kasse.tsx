import { CartItemConfig } from "@/components/cart-item-config";
import { FreeShippingProgress, ShippingSelector } from "@/components/shipping-selector";
import { zoneCountryDefault } from "@/lib/shipping";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { StripeEmbeddedCheckout } from "@/components/stripe-embedded-checkout";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatEUR, useT } from "@/i18n";
import { useCart } from "@/contexts/cart";
import type { CheckoutInput } from "@/lib/checkout-schema";

export const Route = createFileRoute("/kasse")({
  head: () => ({
    meta: [
      { title: "Kasse | DigiNutz" },
      { name: "description", content: "Sicher zur Kasse bei DigiNutz." },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "/kasse" },
    ],
    links: [{ rel: "canonical", href: "/kasse" }],
  }),
  component: CheckoutPage,
});

type CheckoutPayload = Omit<CheckoutInput, "origin" | "environment">;

function CheckoutPage() {
  const { t, locale } = useT();
  const { items, subtotalCents, shippingMethod, shippingZone, shippingCents, totalCents } =
    useCart();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [plz, setPlz] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Deutschland");
  const [payload, setPayload] = useState<CheckoutPayload | null>(null);
  const [, setPendingOrderId] = useState<string | null>(null);



  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error(t("cart.empty"));
      return;
    }
    setPayload({
      email,
      address: { firstName, lastName, street, houseNumber, plz, city, country },
      items: items.map((i) => ({
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        qty: i.qty,
        personalization: Object.fromEntries(
          Object.entries(i.personalization).filter(([, v]) => v != null) as [string, string][],
        ),
      })),
      shippingMethod,
      shippingZone,
      locale,
    });
    requestAnimationFrame(() => {
      document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };


  return (
    <div>
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10">
      <h1 className="font-serif text-4xl text-walnut sm:text-5xl">{t("checkout.title")}</h1>


      <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Section title={t("checkout.contact")}>
            <Input label={t("checkout.email")} type="email" value={email} onChange={setEmail} required maxLength={255} />
          </Section>

          <Section title={t("checkout.address")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t("checkout.firstName")} value={firstName} onChange={setFirstName} required maxLength={80} />
              <Input label={t("checkout.lastName")} value={lastName} onChange={setLastName} required maxLength={80} />
              <div className="sm:col-span-2 grid grid-cols-[1fr_120px] gap-4">
                <Input label={t("checkout.street")} value={street} onChange={setStreet} required maxLength={120} />
                <Input label={t("checkout.houseNumber")} value={houseNumber} onChange={setHouseNumber} required maxLength={20} />
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-4 sm:col-span-2">
                <Input label={t("checkout.plz")} value={plz} onChange={setPlz} required pattern="^\d{4,5}$" maxLength={5} />
                <Input label={t("checkout.city")} value={city} onChange={setCity} required maxLength={80} />
              </div>
              <Input label={t("checkout.country")} value={country} onChange={setCountry} required maxLength={60} />
            </div>
          </Section>

          <Section title={t("checkout.shipping")}>
            <ShippingSelector
              onZoneChange={(zone) => {
                const preset = zoneCountryDefault(zone);
                if (preset) setCountry(preset);
              }}
            />
            <div className="mt-4">
              <FreeShippingProgress />
            </div>
          </Section>

          <Section title={t("checkout.payment")}>
            <p className="text-sm text-muted-foreground">
              Karte, Apple&nbsp;Pay, Google&nbsp;Pay und weitere Methoden werden nach dem Klick auf
              „{t("checkout.placeOrder")}" direkt hier auf der Seite angezeigt.
            </p>
          </Section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl bg-linen/60 p-6 ring-1 ring-border">
          <h3 className="eyebrow">Ihre Bestellung</h3>
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-start gap-3 text-sm">
                <img src={it.image} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="line-clamp-1 font-medium text-walnut">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.qty} × {formatEUR(it.unitPriceCents, locale)}</p>
                  <CartItemConfig item={it} />
                </div>
              </li>

            ))}
          </ul>
          <div className="gold-divider" />
          <Row label={t("cart.subtotal")} value={formatEUR(subtotalCents, locale)} />
          <Row
            label={locale === "en" ? "Shipping costs" : "Versandkosten"}
            value={
              shippingCents === 0
                ? locale === "en"
                  ? "Free shipping"
                  : "Versandkostenfrei"
                : formatEUR(shippingCents, locale)
            }
          />
          <Row label={t("cart.total")} value={formatEUR(totalCents, locale)} big />
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={payload !== null}
            className="mt-3 w-full rounded-full bg-walnut px-6 py-3.5 text-sm font-medium text-cream hover:bg-walnut/90 disabled:opacity-60"
          >
            {payload ? t("checkout.processing") : t("checkout.placeOrder")}
          </motion.button>
          {payload && (
            <button
              type="button"
              onClick={() => setPayload(null)}
              className="w-full text-center text-xs text-muted-foreground hover:text-walnut"
            >
              Angaben ändern
            </button>
          )}
        </aside>
      </form>

      {payload && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl text-walnut">Zahlung</h2>
          <div className="mt-4">
            <StripeEmbeddedCheckout payload={payload} onOrderCreated={setPendingOrderId} />
          </div>
        </section>
      )}
      </div>
    </div>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-walnut">{title}</h2>
      <div className="mt-4 rounded-2xl bg-card p-6 ring-1 ring-border/60">{children}</div>
    </section>
  );
}

function Input({
  label, value, onChange, type = "text", required, maxLength, pattern,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; maxLength?: number; pattern?: string }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        pattern={pattern}
        className="mt-2 w-full rounded-lg border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-brass"
      />
    </label>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? "text-base font-medium text-walnut" : "text-sm text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={big ? "font-serif text-xl" : ""}>{value}</span>
    </div>
  );
}
