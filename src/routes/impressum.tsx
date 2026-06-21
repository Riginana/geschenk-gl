import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum | Lieblingsstück Atelier" },
      { name: "description", content: "Impressum gemäß § 5 TMG." },
      { property: "og:url", content: "/impressum" },
    ],
    links: [{ rel: "canonical", href: "/impressum" }],
  }),
  component: () => (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 TMG</h2>
      <p>Lieblingsstück Atelier<br />Inhaber: Max Mustermann<br />Musterstraße 12<br />10115 Berlin</p>
      <h2>Kontakt</h2>
      <p>Telefon: +49 (0) 30 12345678<br />E-Mail: hallo@lieblingsstueck-atelier.de</p>
      <h2>Umsatzsteuer-ID</h2>
      <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: DE123456789</p>
      <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p>Max Mustermann, Anschrift wie oben.</p>
    </LegalPage>
  ),
});
