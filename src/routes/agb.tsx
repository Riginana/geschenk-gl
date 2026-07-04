import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "AGB | DigiNutz" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen." },
      { property: "og:url", content: "/agb" },
    ],
    links: [{ rel: "canonical", href: "/agb" }],
  }),
  component: () => (
    <LegalPage
      title="Allgemeine Geschäftsbedingungen"
      titleEn="Terms and Conditions"
      children={
        <>
          <h2>1. Geltungsbereich</h2>
          <p>Diese AGB gelten für alle Bestellungen, die Verbraucher und Unternehmer über unseren Online-Shop bei der DigiNutz tätigen.</p>
          <h2>2. Vertragsschluss</h2>
          <p>Die Darstellung der Produkte stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung dar.</p>
          <h2>3. Preise und Versandkosten</h2>
          <p>Alle Preise enthalten die gesetzliche Mehrwertsteuer.</p>
          <h2>4. Zahlung</h2>
          <p>Die Zahlung erfolgt wahlweise über PayPal, Kreditkarte, Apple Pay oder Google Pay.</p>
          <h2>5. Lieferung</h2>
          <p>Die Lieferung erfolgt innerhalb Deutschlands binnen 1–2 Werktagen nach Fertigung.</p>
        </>
      }
      childrenEn={
        <>
          <h2>1. Scope</h2>
          <p>These terms apply to all orders placed by consumers and businesses in our DigiNutz online shop.</p>
          <h2>2. Formation of contract</h2>
          <p>The presentation of products does not constitute a legally binding offer but an invitation to order.</p>
          <h2>3. Prices and shipping costs</h2>
          <p>All prices include statutory VAT.</p>
          <h2>4. Payment</h2>
          <p>Payment is available via PayPal, credit card, Apple Pay or Google Pay.</p>
          <h2>5. Delivery</h2>
          <p>Delivery within Germany takes 1–2 business days after production.</p>
        </>
      }
    />
  ),
});
