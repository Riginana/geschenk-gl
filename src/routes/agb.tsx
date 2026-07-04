import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "AGB | DigiNutz" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen des DigiNutz Onlineshops." },
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
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen
            Kubanych Susamyrbek uulu und Kunden über den Onlineshop DigiNutz.
            Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn,
            wir haben ihnen ausdrücklich schriftlich zugestimmt.
          </p>

          <h2>2. Vertragsschluss</h2>
          <p>
            Die Darstellung der Produkte im Onlineshop stellt kein bindendes Angebot dar,
            sondern eine Aufforderung zur Abgabe eines Angebots durch den Kunden.
            Durch Anklicken des Buttons „Zahlungspflichtig bestellen“ am Ende des
            Bestellvorgangs gibt der Kunde ein verbindliches Angebot zum Abschluss eines
            Kaufvertrags ab. Wir nehmen das Angebot durch Zusendung einer
            E-Mail-Bestätigung an. Der Vertrag kommt mit Absendung dieser Bestätigung zustande.
          </p>

          <h2>3. Widerrufsrecht</h2>
          <p>
            Verbraucher haben ein gesetzliches Widerrufsrecht. Die Einzelheiten regeln
            sich nach unserer Widerrufsbelehrung, die Sie unter{" "}
            <a href="/widerruf" className="underline">/widerruf</a> einsehen können.
          </p>

          <h2>4. Preise und Zahlungsbedingungen</h2>
          <p>
            Alle angegebenen Preise sind Endpreise inklusive der gesetzlichen
            Umsatzsteuer. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet
            (Kleinunternehmerregelung).
          </p>
          <p>
            Die Zahlung erfolgt über die im Bestellprozess angebotenen Methoden:
            PayPal, Kreditkarte, Apple Pay oder Google Pay.
          </p>

          <h2>5. Liefer- und Versandbedingungen</h2>
          <p>
            Die Lieferbedingungen, Versandkosten und Lieferzeiten entnehmen Sie bitte
            der separaten Seite{" "}
            <a href="/versand" className="underline">Versand & Lieferzeiten</a>.
          </p>

          <h2>6. Eigentumsvorbehalt</h2>
          <p>
            Die gelieferte Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.
          </p>

          <h2>7. Mängelhaftung</h2>
          <p>
            Es gelten die gesetzlichen Gewährleistungsrechte. Bei Mängeln am Produkt
            haben Verbraucher zunächst die Wahl zwischen Nacherfüllung (Nachbesserung
            oder Ersatzlieferung). Ist die Nacherfüllung fehlgeschlagen, kann der Kunde
            nach seiner Wahl Herabsetzung des Kaufpreises (Minderung) oder Rückgängigmachung
            des Kaufvertrags (Rücktritt) verlangen.
          </p>

          <h2>8. Anwendbares Recht</h2>
          <p>
            Für alle Rechtsbeziehungen zwischen uns und dem Kunden gilt das Recht der
            Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
          </p>

          <h2>9. Alternative Streitbeilegung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an einem Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </>
      }
      childrenEn={
        <>
          <h2>1. Scope</h2>
          <p>
            These Terms and Conditions (T&amp;C) apply to all contracts between
            Kubanych Susamyrbek uulu and customers concluded via the DigiNutz online shop.
            Deviating conditions of the customer shall not be recognised unless we have
            expressly agreed to them in writing.
          </p>

          <h2>2. Formation of contract</h2>
          <p>
            The presentation of products in the online shop does not constitute a binding
            offer, but an invitation to the customer to make an offer. By clicking the
            &quot;Zahlungspflichtig bestellen&quot; (Place binding order) button at the end
            of the checkout process, the customer submits a binding offer to conclude a
            purchase contract. We accept the offer by sending an order confirmation email.
            The contract is formed upon dispatch of this confirmation.
          </p>

          <h2>3. Right of withdrawal</h2>
          <p>
            Consumers have a statutory right of withdrawal. Details are governed by our
            withdrawal notice, which you can view at{" "}
            <a href="/widerruf" className="underline">/widerruf</a>.
          </p>

          <h2>4. Prices and payment terms</h2>
          <p>
            All prices shown are final prices including statutory VAT. Pursuant to § 19
            of the German VAT Act (small business rule), no VAT is charged.
          </p>
          <p>
            Payment is made via the methods offered during checkout:
            PayPal, credit card, Apple Pay or Google Pay.
          </p>

          <h2>5. Delivery and shipping terms</h2>
          <p>
            Please refer to our separate{" "}
            <a href="/versand" className="underline">Shipping &amp; Delivery</a>{" "}
            page for delivery conditions, shipping costs and delivery times.
          </p>

          <h2>6. Retention of title</h2>
          <p>
            The delivered goods remain our property until full payment has been received.
          </p>

          <h2>7. Liability for defects</h2>
          <p>
            The statutory warranty rights apply. In the event of defects, consumers are
            initially entitled to choose between subsequent performance (repair or replacement
            delivery). If subsequent performance fails, the customer may demand, at their
            option, a reduction of the purchase price (abatement) or rescission of the
            contract (withdrawal).
          </p>

          <h2>8. Applicable law</h2>
          <p>
            All legal relations between us and the customer shall be governed by the laws
            of the Federal Republic of Germany, excluding the UN Convention on Contracts
            for the International Sale of Goods (CISG).
          </p>

          <h2>9. Alternative dispute resolution</h2>
          <p>
            We are neither willing nor obliged to participate in dispute resolution
            proceedings before a consumer arbitration board.
          </p>
        </>
      }
    />
  ),
});
