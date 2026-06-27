import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatEUR, useT } from "@/i18n";
import { useCart } from "@/contexts/cart";
import { submitOrder } from "@/lib/orders.functions";

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

type PaymentMethod = "paypal" | "stripe" | "kreditkarte" | "apple_pay" | "google_pay";

function CheckoutPage() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const { items, subtotalCents, clear } = useCart();
  const place = useServerFn(submitOrder);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [plz, setPlz] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Deutschland");
  const [shipping, setShipping] = useState<"standard" | "express">("standard");
  const [payment, setPayment] = useState<PaymentMethod>("paypal");
  const [submitting, setSubmitting] = useState(false);

  const shippingCents = shipping === "express" ? 990 : subtotalCents >= 5000 ? 0 : 490;
  const total = subtotalCents + shippingCents;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error(t("cart.empty"));
      return;
    }
    setSubmitting(true);
    try {
      // TODO: real payment integration (PayPal / Stripe / Apple Pay / Google Pay)
      const res = await place({
        data: {
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
          shippingMethod: shipping,
          paymentMethod: payment,
          locale,
        },
      });
      clear();
      navigate({ to: "/bestellung-bestaetigt", search: { id: res.id } });
    } catch (err) {
      console.error("[kasse] submit failed", err);
      toast.error("Bestellung fehlgeschlagen", { description: "Bitte versuchen Sie es erneut." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            <div className="grid gap-3 sm:grid-cols-2">
              <RadioCard active={shipping === "standard"} onClick={() => setShipping("standard")} title={t("checkout.standard")} price={subtotalCents >= 5000 ? "Kostenlos" : formatEUR(490, locale)} />
              <RadioCard active={shipping === "express"} onClick={() => setShipping("express")} title={t("checkout.express")} price={formatEUR(990, locale)} />
            </div>
          </Section>

          <Section title={t("checkout.payment")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  { id: "paypal", label: "PayPal", style: "bg-[#003087] text-white" },
                  { id: "stripe", label: "Stripe", style: "bg-[#635bff] text-white" },
                  { id: "kreditkarte", label: "Kreditkarte", style: "bg-card text-walnut" },
                  { id: "apple_pay", label: "Apple Pay", style: "bg-black text-white" },
                  { id: "google_pay", label: "Google Pay", style: "bg-white text-[#202124] ring-1 ring-border" },
                ] as { id: PaymentMethod; label: string; style: string }[]
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayment(p.id)}
                  className={`relative rounded-xl px-5 py-4 text-sm font-medium transition ${p.style} ${
                    payment === p.id ? "ring-2 ring-brass" : "ring-1 ring-transparent"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Vorschau-Bestellung — echte Zahlungsabwicklung folgt in der nächsten Version.
            </p>
          </Section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl bg-linen/60 p-6 ring-1 ring-border">
          <h3 className="eyebrow">Ihre Bestellung</h3>
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm">
                <img src={it.image} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="line-clamp-1 font-medium text-walnut">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.qty} × {formatEUR(it.unitPriceCents, locale)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="gold-divider" />
          <Row label={t("cart.subtotal")} value={formatEUR(subtotalCents, locale)} />
          <Row label={t("cart.shipping")} value={shippingCents === 0 ? "Kostenlos" : formatEUR(shippingCents, locale)} />
          <Row label={t("cart.total")} value={formatEUR(total, locale)} big />
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="mt-3 w-full rounded-full bg-walnut px-6 py-3.5 text-sm font-medium text-cream hover:bg-walnut/90 disabled:opacity-60"
          >
            {submitting ? t("checkout.processing") : t("checkout.placeOrder")}
          </motion.button>
        </aside>
      </form>
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

function RadioCard({ active, onClick, title, price }: { active: boolean; onClick: () => void; title: string; price: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border px-5 py-4 text-left text-sm transition ${
        active ? "border-walnut bg-walnut/5" : "border-border bg-cream"
      }`}
    >
      <span className="font-medium text-walnut">{title}</span>
      <span className="text-muted-foreground">{price}</span>
    </button>
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
