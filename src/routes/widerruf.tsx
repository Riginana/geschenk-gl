import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/widerruf")({
  head: () => ({
    meta: [
      { title: "Widerrufsrecht | Lieblingsstück Atelier" },
      { name: "description", content: "Widerrufsbelehrung und Hinweis zum Ausschluss des Widerrufsrechts bei personalisierten Produkten." },
      { property: "og:url", content: "/widerruf" },
    ],
    links: [{ rel: "canonical", href: "/widerruf" }],
  }),
  component: () => (
    <LegalPage title="Widerrufsrecht">
      <h2>Widerrufsbelehrung</h2>
      <p>Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen den Vertrag zu widerrufen.</p>
      <h2>Hinweis bei personalisierten Produkten</h2>
      <p>Bei nach Kundenspezifikation gefertigten Waren (z.B. Geldgeschenke mit Namen, Datum oder individuellem Text) ist das Widerrufsrecht gemäß § 312g Abs. 2 Nr. 1 BGB ausgeschlossen.</p>
    </LegalPage>
  ),
});
