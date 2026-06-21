import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | DigiNutz" },
      { name: "description", content: "Häufig gestellte Fragen zu Personalisierung, Versand und Materialien." },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
  }),
  component: () => (
    <LegalPage title="Häufig gestellte Fragen">
      <h2>Wie funktioniert die Personalisierung?</h2>
      <p>Sie geben Name, Datum und gewünschten Text direkt auf der Produktseite ein. Wir fertigen Ihr Geschenk genau nach diesen Angaben.</p>
      <h2>Welche Materialien werden verwendet?</h2>
      <p>Eichenholz aus nachhaltiger Forstwirtschaft oder schweres Kraftpapier (350 g/m²).</p>
      <h2>Wie lange dauert die Lieferung?</h2>
      <p>3–5 Werktage Fertigung + 1–2 Werktage Versand innerhalb Deutschlands.</p>
      <h2>Kann ich personalisierte Bestellungen zurücksenden?</h2>
      <p>Personalisierte Produkte sind vom Widerrufsrecht ausgeschlossen — siehe Widerrufsbelehrung.</p>
    </LegalPage>
  ),
});
