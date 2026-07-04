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
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          </p>
          <p>
            Kubanych Susamyrbek uulu<br />
            Am Färberhof 9<br />
            91052 Erlangen<br />
            Deutschland
          </p>
          <p>
            Telefon: 017624299597<br />
            E-Mail: diginutz.e@gmail.com
          </p>

          <h2>2. Hosting und Server-Logfiles</h2>
          <p>
            Diese Website wird über die Plattform Lovable gehostet. Lovable nutzt
            für das Hosting moderne Cloud-Infrastrukturen (u. a. Vercel und Supabase).
            Im Rahmen des Hostings werden automatisch Server-Logfiles erstellt,
            in denen folgende Informationen gespeichert werden:
          </p>
          <ul>
            <li>IP-Adresse des anfragenden Geräts</li>
            <li>Datum und Uhrzeit der Anfrage</li>
            <li>Name und URL der abgerufenen Datei bzw. Seite</li>
            <li>Referrer-URL (die zuvor besuchte Seite)</li>
            <li>Verwendeter Browser und Betriebssystem</li>
          </ul>
          <p>
            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse an der Gewährleistung der Betriebssicherheit,
            Fehleranalyse und Missbrauchsprävention). Die Logfiles werden für einen
            begrenzten Zeitraum gespeichert und danach automatisch gelöscht.
          </p>

          <h2>3. Cookies und Analyse-Tools</h2>
          <p>
            Diese Website verwendet keine Analyse- oder Tracking-Cookies.
            Es werden keine Tools wie Google Analytics, Meta Pixel oder vergleichbare
            Dienste eingesetzt.
          </p>
          <p>
            Technisch notwendige Cookies können zum Zwecke der Funktionalität
            (z. B. Warenkorb, Spracheinstellung) verwendet werden.
          </p>

          <h2>4. Kontaktaufnahme</h2>
          <p>
            Bei der Kontaktaufnahme per Kontaktformular, E-Mail, WhatsApp oder
            Instagram verarbeiten wir die von Ihnen mitgeteilten Daten (z. B. Name,
            E-Mail-Adresse, Telefonnummer, Nachrichtentext) ausschließlich zur
            Bearbeitung Ihrer Anfrage und zur Kommunikation mit Ihnen.
          </p>
          <p>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw.
            vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
            Interesse an der Beantwortung von Anfragen).
          </p>
          <p>
            Hinweis: Bei Nutzung von WhatsApp gelten die Datenschutzbestimmungen
            der Meta Platforms Ireland Limited. Weitere Informationen finden Sie in der
            {" "}
            <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">
              WhatsApp-Datenschutzerklärung
            </a>.
          </p>
          <p>
            Bei Nutzung von Instagram gelten die Datenschutzbestimmungen
            der Meta Platforms Ireland Limited. Weitere Informationen finden Sie in der
            {" "}
            <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="underline">
              Instagram-Datenschutzerklärung
            </a>.
          </p>

          <h2>5. Datenverarbeitung zur Bestellabwicklung</h2>
          <p>
            Zur Abwicklung von Bestellungen verarbeiten wir die für die
            Vertragserfüllung erforderlichen personenbezogenen Daten (Name,
            Anschrift, E-Mail-Adresse, Telefonnummer, Zahlungs- und
            Lieferinformationen).
          </p>
          <p>
            <strong>Weitergabe an Versanddienstleister:</strong> Zur Zustellung der
            Ware geben wir Ihre Lieferdaten an den von uns beauftragten
            Versanddienstleister (DHL) weiter. Die Weitergabe erfolgt auf Grundlage
            von Art. 6 Abs. 1 lit. b DSGVO.
          </p>
          <p>
            <strong>Zahlungsabwicklung:</strong> Zur Zahlungsabwicklung übergeben
            wir die erforderlichen Zahlungsdaten an die jeweils von Ihnen gewählten
            Zahlungsdienstleister:
          </p>
          <ul>
            <li>
              PayPal (PayPal (Europe) S.à r.l. et Cie, S.C.A.) —{" "}
              <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" className="underline">
                Datenschutzerklärung
              </a>
            </li>
            <li>
              Stripe (Stripe Payments Europe, Limited) —{" "}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                Datenschutzerklärung
              </a>
            </li>
            <li>
              Apple Pay (Apple Distribution International Ltd.) —{" "}
              <a href="https://www.apple.com/legal/privacy/de-ww/" target="_blank" rel="noopener noreferrer" className="underline">
                Datenschutzerklärung
              </a>
            </li>
            <li>
              Google Pay (Google Ireland Limited) —{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                Datenschutzerklärung
              </a>
            </li>
            <li>
              Klarna (Klarna Bank AB (publ)) —{" "}
              <a href="https://www.klarna.com/de/datenschutz/" target="_blank" rel="noopener noreferrer" className="underline">
                Datenschutzerklärung
              </a>
            </li>
          </ul>
          <p>
            Die Weitergabe erfolgt ausschließlich zum Zweck der Zahlungsabwicklung
            auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <h2>6. Rechte des Betroffenen</h2>
          <p>
            Sie haben das Recht:
          </p>
          <ul>
            <li>
              gemäß Art. 15 DSGVO Auskunft über Ihre von uns verarbeiteten
              personenbezogenen Daten zu verlangen;
            </li>
            <li>
              gemäß Art. 16 DSGVO unverzüglich die Berichtigung unrichtiger
              personenbezogener Daten zu verlangen;
            </li>
            <li>
              gemäß Art. 17 DSGVO die Löschung Ihrer bei uns gespeicherten
              personenbezogenen Daten zu verlangen, soweit nicht die Verarbeitung
              zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist;
            </li>
            <li>
              gemäß Art. 18 DSGVO die Einschränkung der Verarbeitung Ihrer
              personenbezogenen Daten zu verlangen;
            </li>
            <li>
              gemäß Art. 20 DSGVO Ihre personenbezogenen Daten in einem
              strukturierten, gängigen und maschinenlesbaren Format zu erhalten
              oder die Übermittlung an einen anderen Verantwortlichen zu verlangen
              (Datenübertragbarkeit);
            </li>
            <li>
              gemäß Art. 21 DSGVO Widerspruch gegen die Verarbeitung Ihrer
              personenbezogenen Daten einzulegen, sofern die Verarbeitung auf
             grundlage eines berechtigten Interesses erfolgt;
            </li>
            <li>
              gemäß Art. 77 DSGVO sich bei einer Aufsichtsbehörde zu beschweren,
              wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen
              datenschutzrechtliche Bestimmungen verstößt.
            </li>
          </ul>

          <h2>7. Speicherdauer</h2>
          <p>
            Personenbezogene Daten werden nur so lange gespeichert, wie es für die
            Erreichung des jeweiligen Verarbeitungszwecks erforderlich ist oder
            eine gesetzliche Aufbewahrungspflicht besteht. Bestands- und
            Verkehrsdaten aus Vertragsverhältnissen werden nach Ablauf der
            steuer- und handelsrechtlichen Aufbewahrungsfristen (in der Regel
            6 bis 10 Jahre) gelöscht. Kontaktanfragen werden nach vollständiger
            Bearbeitung gelöscht, sofern keine weitergehende Geschäftsbeziehung
            entsteht.
          </p>
        </>
      }
      childrenEn={
        <>
          <h2>1. Controller</h2>
          <p>
            The controller responsible for data processing on this website is:
          </p>
          <p>
            Kubanych Susamyrbek uulu<br />
            Am Färberhof 9<br />
            91052 Erlangen<br />
            Germany
          </p>
          <p>
            Phone: +49 176 24299597<br />
            Email: diginutz.e@gmail.com
          </p>

          <h2>2. Hosting and server log files</h2>
          <p>
            This website is hosted via the Lovable platform. Lovable uses modern
            cloud infrastructure for hosting (including Vercel and Supabase).
            In the course of hosting, server log files are automatically created
            containing the following information:
          </p>
          <ul>
            <li>IP address of the requesting device</li>
            <li>Date and time of the request</li>
            <li>Name and URL of the retrieved file or page</li>
            <li>Referrer URL (the previously visited page)</li>
            <li>Browser and operating system used</li>
          </ul>
          <p>
            Processing is based on Art. 6 (1) lit. f GDPR (legitimate interest in
            ensuring operational security, error analysis and abuse prevention).
            Log files are retained for a limited period and then automatically deleted.
          </p>

          <h2>3. Cookies and analytics tools</h2>
          <p>
            This website does not use any analytics or tracking cookies.
            Tools such as Google Analytics, Meta Pixel or comparable services are not used.
          </p>
          <p>
            Technically necessary cookies may be used for functionality purposes
            (e.g. shopping cart, language settings).
          </p>

          <h2>4. Contact</h2>
          <p>
            When you contact us via the contact form, email, WhatsApp or Instagram,
            we process the data you provide (e.g. name, email address, phone number,
            message content) solely for the purpose of handling your inquiry and
            communicating with you.
          </p>
          <p>
            The legal basis is Art. 6 (1) lit. b GDPR (contract performance or
            pre-contractual measures) or Art. 6 (1) lit. f GDPR (legitimate interest
            in responding to inquiries).
          </p>
          <p>
            Please note: When using WhatsApp, the privacy policy of Meta Platforms
            Ireland Limited applies. For more information, see the
            {" "}
            <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">
              WhatsApp Privacy Policy
            </a>.
          </p>
          <p>
            When using Instagram, the privacy policy of Meta Platforms Ireland Limited
            applies. For more information, see the
            {" "}
            <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="underline">
              Instagram Privacy Policy
            </a>.
          </p>

          <h2>5. Data processing for order fulfilment</h2>
          <p>
            To process orders, we process the personal data required for performance
            of the contract (name, address, email address, phone number, payment and
            delivery information).
          </p>
          <p>
            <strong>Disclosure to shipping service providers:</strong> To deliver the
            goods, we forward your delivery data to the shipping service provider
            commissioned by us (DHL). Disclosure is based on Art. 6 (1) lit. b GDPR.
          </p>
          <p>
            <strong>Payment processing:</strong> For payment processing, we transmit
            the required payment data to the payment service provider selected by you:
          </p>
          <ul>
            <li>
              PayPal (PayPal (Europe) S.à r.l. et Cie, S.C.A.) —{" "}
              <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" className="underline">
                Privacy Policy
              </a>
            </li>
            <li>
              Stripe (Stripe Payments Europe, Limited) —{" "}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                Privacy Policy
              </a>
            </li>
            <li>
              Apple Pay (Apple Distribution International Ltd.) —{" "}
              <a href="https://www.apple.com/legal/privacy/de-ww/" target="_blank" rel="noopener noreferrer" className="underline">
                Privacy Policy
              </a>
            </li>
            <li>
              Google Pay (Google Ireland Limited) —{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                Privacy Policy
              </a>
            </li>
            <li>
              Klarna (Klarna Bank AB (publ)) —{" "}
              <a href="https://www.klarna.com/de/datenschutz/" target="_blank" rel="noopener noreferrer" className="underline">
                Privacy Policy
              </a>
            </li>
          </ul>
          <p>
            Disclosure is solely for the purpose of payment processing on the basis
            of Art. 6 (1) lit. b GDPR.
          </p>

          <h2>6. Rights of the data subject</h2>
          <p>You have the right to:</p>
          <ul>
            <li>
              request information about your personal data processed by us pursuant
              to Art. 15 GDPR;
            </li>
            <li>
              request the immediate rectification of inaccurate personal data
              pursuant to Art. 16 GDPR;
            </li>
            <li>
              request the erasure of personal data stored by us pursuant to Art. 17 GDPR,
              unless processing is necessary for compliance with a legal obligation;
            </li>
            <li>
              request the restriction of processing of your personal data pursuant
              to Art. 18 GDPR;
            </li>
            <li>
              receive your personal data in a structured, commonly used and
              machine-readable format or to request transmission to another controller
              pursuant to Art. 20 GDPR (data portability);
            </li>
            <li>
              object to the processing of your personal data pursuant to Art. 21 GDPR,
              where processing is based on legitimate interests;
            </li>
            <li>
              lodge a complaint with a supervisory authority pursuant to Art. 77 GDPR
              if you believe that the processing of your data violates data protection
              provisions.
            </li>
          </ul>

          <h2>7. Storage period</h2>
          <p>
            Personal data is stored only for as long as is necessary to achieve the
            respective processing purpose or where a statutory retention obligation
            exists. Inventory and transaction data from contractual relationships are
            deleted after the expiry of tax and commercial law retention periods
            (usually 6 to 10 years). Contact inquiries are deleted after complete
            processing, unless a further business relationship arises.
          </p>
        </>
      }
    />
  ),
});
