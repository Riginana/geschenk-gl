import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "AGB | Lieblingsstück Atelier" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen." },
      { property: "og:url", content: "/agb" },
    ],
    links: [{ rel: "canonical", href: "/agb" }],
  }),
  component: () => (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <h2>1. Geltungsbereich</h2>
      <p>Diese AGB gelten für alle Bestellungen, die Verbraucher und Unternehmer über unseren Online-Shop bei der Lieblingsstück Atelier tätigen.</p>
      <h2>2. Vertragsschluss</h2>
      <p>Die Darstellung der Produkte stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung dar.</p>
      <h2>3. Preise und Versandkosten</h2>
      <p>Alle Preise enthalten die gesetzliche Mehrwertsteuer.</p>
      <h2>4. Zahlung</h2>
      <p>Die Zahlung erfolgt wahlweise über PayPal, Kreditkarte, Apple Pay oder Google Pay.</p>
      <h2>5. Lieferung</h2>
      <p>Die Lieferung erfolgt innerhalb Deutschlands binnen 1–2 Werktagen nach Fertigung.</p>
    </LegalPage>
  ),
});
