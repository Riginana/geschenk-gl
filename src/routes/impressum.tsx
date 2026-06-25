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
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-900 px-4 py-3 text-center font-medium">
        ⚠️ Diese Seite enthält noch Platzhalter — bitte vor dem Launch ausfüllen.
      </div>
      <LegalPage title="Impressum">
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>DigiNutz<br />Inhaber: <span className="text-red-600 font-bold">[Kubanych Susamyrbek uulu]</span><br /><span className="text-red-600 font-bold">[Am Färberhof 9]</span><br /><span className="text-red-600 font-bold">[91052 Erlangen]</span></p>
        <h2>Kontakt</h2>
        <p><span className="text-red-600 font-bold">[Telefon einfügen]</span><br /><span className="text-red-600 font-bold">[E-Mail einfügen]</span></p>
        <h2>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: <span className="text-red-600 font-bold">[DE366034898]</span></p>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:</h2>
        <p><span className="text-red-600 font-bold">[Kubanych Susamyrbek uulu]</span>, Anschrift wie oben.</p>
      </LegalPage>
    </>
  ),
});
