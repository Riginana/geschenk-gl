import { createFileRoute } from "@tanstack/react-router";
import { Clock, Truck, Wallet, Globe, ShieldCheck, Package } from "lucide-react";
import { useT } from "@/i18n";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/versand")({
  head: () => ({
    meta: [
      { title: "Versand & Lieferung | DigiNutz" },
      { name: "description", content: "Versandinformationen, Lieferzeiten und Kosten für den DigiNutz Onlineshop." },
      { property: "og:url", content: "/versand" },
    ],
    links: [{ rel: "canonical", href: "/versand" }],
  }),
  component: ShippingPage,
});

const itemsDe = [
  {
    icon: Clock,
    title: "Herstellungszeit",
    text: '[z. B. "3–5 Werktage" — Personalisierung braucht Zeit]',
  },
  {
    icon: Truck,
    title: "Versandzeit",
    text: '[z. B. "1–3 Werktage innerhalb Deutschlands"]',
  },
  {
    icon: Wallet,
    title: "Versandkosten",
    text: "[genauer Betrag oder Staffelung nach Gewicht/Land]",
  },
  {
    icon: Globe,
    title: "Versandländer",
    text: '[z. B. "Deutschland, Österreich, Schweiz, EU"]',
  },
  {
    icon: ShieldCheck,
    title: "Versandart",
    text: '[z. B. "DHL Paket, versichert"]',
  },
  {
    icon: Package,
    title: "Verpackung",
    text: "Rahmen und Geschenke werden bruchsicher und liebevoll verpackt, damit sie heil bei dir ankommen.",
  },
];

const itemsEn = [
  {
    icon: Clock,
    title: "Production Time",
    text: '[e.g. "3–5 business days" — personalization takes time]',
  },
  {
    icon: Truck,
    title: "Shipping Time",
    text: '[e.g. "1–3 business days within Germany"]',
  },
  {
    icon: Wallet,
    title: "Shipping Costs",
    text: "[exact amount or tiered pricing by weight/country]",
  },
  {
    icon: Globe,
    title: "Shipping Countries",
    text: '[e.g. "Germany, Austria, Switzerland, EU"]',
  },
  {
    icon: ShieldCheck,
    title: "Shipping Method",
    text: '[e.g. "DHL parcel, insured"]',
  },
  {
    icon: Package,
    title: "Packaging",
    text: "Frames and gifts are packed securely and with care so they arrive at your door in perfect condition.",
  },
];

function ShippingPage() {
  const { locale, t } = useT();
  const isEn = locale === "en";
  const items = isEn ? itemsEn : itemsDe;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{isEn ? "Shipping" : "Versand"}</p>
          <h1 className="mt-3 font-serif text-4xl text-walnut sm:text-5xl">
            {isEn ? "Shipping & Delivery" : "Versand & Lieferung"}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {isEn
              ? "We want you to feel confident when ordering. Here you will find all the information about production, shipping, and delivery."
              : "Wir möchten, dass du dich beim Bestellen gut aufgehoben fühlst. Hier findest du alle Informationen zur Fertigung, zum Versand und zur Lieferung."}
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <Reveal key={i} delay={i * 0.06}>
              <div className="group relative h-full rounded-2xl bg-card p-7 ring-1 ring-border/60 transition hover:shadow-[0_24px_50px_-30px_rgba(60,40,20,0.25)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brass/15 text-walnut transition group-hover:bg-brass/25">
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <h2 className="mt-5 font-serif text-2xl text-walnut">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.3}>
        <div className="mt-16 rounded-2xl border border-border/60 bg-linen/40 p-8 text-center">
          <h2 className="font-serif text-2xl text-walnut">
            {isEn ? "Questions about shipping?" : "Fragen zum Versand?"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEn
              ? "We are happy to help. Just send us an email or message."
              : "Wir helfen dir gerne weiter. Schreib uns einfach eine E-Mail oder Nachricht."}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
