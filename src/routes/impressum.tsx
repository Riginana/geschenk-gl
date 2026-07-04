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
    <LegalPage
      title="Impressum"
      titleEn="Legal Notice"
      children={
        <>
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            Kubanych Susamyrbek uulu<br />
            Am Färberhof 9<br />
            91052 Erlangen<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            Telefon: 017624299597<br />
            E-Mail: diginutz.e@gmail.com
          </p>

          <h2>Umsatzsteuer</h2>
          <p>Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).</p>

          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>Kubanych Susamyrbek uulu, Am Färberhof 9, 91052 Erlangen</p>

          <h2>Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an einem
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>
        </>
      }
      childrenEn={
        <>
          <h2>Information according to § 5 TMG</h2>
          <p>
            Kubanych Susamyrbek uulu<br />
            Am Färberhof 9<br />
            91052 Erlangen<br />
            Germany
          </p>

          <h2>Contact</h2>
          <p>
            Phone: +49 176 24299597<br />
            Email: diginutz.e@gmail.com
          </p>

          <h2>VAT</h2>
          <p>Pursuant to § 19 of the German VAT Act (small business rule), no VAT is charged.</p>

          <h2>Responsible for content under § 18 (2) MStV</h2>
          <p>Kubanych Susamyrbek uulu, Am Färberhof 9, 91052 Erlangen, Germany</p>

          <h2>Consumer dispute resolution</h2>
          <p>
            We are neither willing nor obliged to participate in dispute
            resolution proceedings before a consumer arbitration board.
          </p>
        </>
      }
    />
  ),
});
