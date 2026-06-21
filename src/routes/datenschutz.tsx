import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung | Lieblingsstück Atelier" },
      { name: "description", content: "Datenschutzerklärung gemäß DSGVO." },
      { property: "og:url", content: "/datenschutz" },
    ],
    links: [{ rel: "canonical", href: "/datenschutz" }],
  }),
  component: () => (
    <LegalPage title="Datenschutzerklärung">
      <h2>1. Verantwortlicher</h2>
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist Lieblingsstück Atelier, Musterstraße 12, 10115 Berlin.</p>
      <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
      <p>Wir verarbeiten personenbezogene Daten nur zur Vertragsabwicklung, Kommunikation und gesetzlich zulässigen Marketingmaßnahmen.</p>
      <h2>3. Ihre Rechte</h2>
      <ul>
        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
      </ul>
    </LegalPage>
  ),
});
