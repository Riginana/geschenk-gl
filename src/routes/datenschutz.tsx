import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung | DigiNutz" },
      { name: "description", content: "Datenschutzerklärung gemäß DSGVO." },
      { property: "og:url", content: "/datenschutz" },
    ],
    links: [{ rel: "canonical", href: "/datenschutz" }],
  }),
  component: () => (
    <LegalPage
      title="Datenschutzerklärung"
      titleEn="Privacy Policy"
      children={
        <>
          <h2>1. Verantwortlicher</h2>
          <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist DigiNutz, Musterstraße 12, 10115 Berlin.</p>
          <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p>Wir verarbeiten personenbezogene Daten nur zur Vertragsabwicklung, Kommunikation und gesetzlich zulässigen Marketingmaßnahmen.</p>
          <h2>3. Ihre Rechte</h2>
          <ul>
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          </ul>
        </>
      }
      childrenEn={
        <>
          <h2>1. Controller</h2>
          <p>The controller responsible for data processing on this website is DigiNutz, Musterstraße 12, 10115 Berlin, Germany.</p>
          <h2>2. Collection and storage of personal data</h2>
          <p>We process personal data only for the fulfilment of contracts, communication, and legally permitted marketing.</p>
          <h2>3. Your rights</h2>
          <ul>
            <li>Right of access (Art. 15 GDPR)</li>
            <li>Right to rectification (Art. 16 GDPR)</li>
            <li>Right to erasure (Art. 17 GDPR)</li>
            <li>Right to restriction of processing (Art. 18 GDPR)</li>
          </ul>
        </>
      }
    />
  ),
});
