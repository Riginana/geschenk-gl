import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/versand")({
  head: () => ({
    meta: [
      { title: "Versand & Lieferzeiten | Lieblingsstück Atelier" },
      { name: "description", content: "Versandkosten, Lieferzeiten und Versandländer." },
      { property: "og:url", content: "/versand" },
    ],
    links: [{ rel: "canonical", href: "/versand" }],
  }),
  component: () => (
    <LegalPage title="Versand & Lieferzeiten">
      <h2>Fertigungszeit</h2>
      <p>Jedes Stück wird einzeln gefertigt. Die Bearbeitungszeit beträgt 3–5 Werktage.</p>
      <h2>Versand innerhalb Deutschlands</h2>
      <p>DHL versichert · 4,90 € · ab 50 € Bestellwert versandkostenfrei · 1–2 Werktage.</p>
      <h2>Versand EU</h2>
      <p>9,90 € · 3–6 Werktage.</p>
    </LegalPage>
  ),
});
