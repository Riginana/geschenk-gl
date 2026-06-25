import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum | DigiNutz" },
      { name: "description", content: "Impressum gemäß § 5 TMG." },
      { property: "og:url", content: "/impressum" },
    ],
    links: [{ rel: "canonical", href: "/impressum" }],
  }),
  component: () => (
    <>
      <LegalPage title="Impressum">
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>DigiNutz<br />Inhaber: [Kubanych Susamyrbek uulu]<br />[Am Färberhof 9]<br />[91052 Erlangen]</p>
        <h2>Kontakt</h2>
        <p>[Telefon einfügen]<br />diginutz.e@gmail.com</p>
        <h2>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: [DE366034898]</p>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:</h2>
        <p>[Kubanych Susamyrbek uulu], Anschrift wie oben.</p>
      </LegalPage>
    </>
  ),
});
