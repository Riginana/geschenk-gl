import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/versand")({
  head: () => ({
    meta: [
      { title: "Versand & Lieferzeiten | DigiNutz" },
      { name: "description", content: "Versandkosten, Lieferzeiten und Versandländer." },
      { property: "og:url", content: "/versand" },
    ],
    links: [{ rel: "canonical", href: "/versand" }],
  }),
  component: () => (
    <LegalPage
      title="Versand & Lieferzeiten"
      titleEn="Shipping & Delivery"
      children={
        <>
          <h2>Fertigungszeit</h2>
          <p>Jedes Stück wird einzeln gefertigt. Die Bearbeitungszeit beträgt 3–5 Werktage.</p>
          <h2>Versand innerhalb Deutschlands</h2>
          <p>DHL versichert · 4,90 € · ab 50 € Bestellwert versandkostenfrei · 1–2 Werktage.</p>
          <h2>Versand EU</h2>
          <p>9,90 € · 3–6 Werktage.</p>
        </>
      }
      childrenEn={
        <>
          <h2>Production time</h2>
          <p>Every piece is crafted individually. Production takes 3–5 business days.</p>
          <h2>Shipping within Germany</h2>
          <p>Insured DHL · €4.90 · free shipping on orders over €50 · 1–2 business days.</p>
          <h2>Shipping within the EU</h2>
          <p>€9.90 · 3–6 business days.</p>
        </>
      }
    />
  ),
});
