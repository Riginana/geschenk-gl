import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/widerruf")({
  head: () => ({
    meta: [
      { title: "Widerrufsbelehrung | DigiNutz" },
      { name: "description", content: "Widerrufsbelehrung gemäß BGB für den DigiNutz Onlineshop." },
      { property: "og:url", content: "/widerruf" },
    ],
    links: [{ rel: "canonical", href: "/widerruf" }],
  }),
  component: () => (
    <LegalPage
      title="Widerrufsbelehrung"
      titleEn="Right of Withdrawal"
      children={
        <>
          <h2>Widerrufsrecht</h2>
          <p>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
            diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage
            ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht
            der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat.
          </p>
          <p>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Kubanych Susamyrbek uulu,
            Am Färberhof 9, 91052 Erlangen, Deutschland, Tel.: 017624299597,
            E-Mail: diginutz.e@gmail.com) mittels einer eindeutigen Erklärung
            (z. B. Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu
            widerrufen, informieren. Sie können dafür das unten stehende
            Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
          </p>

          <h2>Folgen des Widerrufs</h2>
          <p>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die
            wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit
            Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine
            andere Art der Lieferung als die von uns angebotene, günstigste
            Standardlieferung gewählt haben), unverzüglich und spätestens binnen
            vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
            Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese
            Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der
            ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde
            ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen
            dieser Rückzahlung Entgelte berechnet.
          </p>
          <p>
            Wir können die Rückzahlung verweigern, bis wir die Waren wieder
            zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie
            die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt
            ist.
          </p>
          <p>
            Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen
            vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses
            Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die
            Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn
            Tagen absenden.
          </p>
          <p>
            Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.
          </p>
          <p>
            Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn
            dieser Wertverlust auf einen zur Prüfung der Beschaffenheit,
            Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit
            ihnen zurückzuführen ist.
          </p>

          <h2>Muster-Widerrufsformular</h2>
          <div className="rounded-lg border border-border bg-linen/40 p-6 text-sm leading-relaxed">
            <p className="font-semibold">An</p>
            <p className="mt-1">
              Kubanych Susamyrbek uulu<br />
              Am Färberhof 9<br />
              91052 Erlangen<br />
              Deutschland<br />
              E-Mail: diginutz.e@gmail.com
            </p>
            <p className="mt-4">
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen
              Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der
              folgenden Dienstleistung (*)
            </p>
            <p className="mt-2">— Bestellt am (*)/erhalten am (*)</p>
            <p className="mt-2">— Name des/der Verbraucher(s)</p>
            <p className="mt-2">— Anschrift des/der Verbraucher(s)</p>
            <p className="mt-2">
              — Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
            </p>
            <p className="mt-2">— Datum</p>
            <p className="mt-4 text-muted-foreground">(*) Unzutreffendes streichen.</p>
          </div>

          <h2>Ausschluss bzw. vorzeitiges Erlöschen des Widerrufsrechts</h2>
          <p>
            Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren,
            die nicht vorgefertigt sind und für deren Herstellung eine individuelle
            Auswahl oder Bestimmung durch den Verbraucher maßgeblich ist oder die
            eindeutig auf die persönlichen Bedürfnisse des Verbrauchers zugeschnitten
            sind.
          </p>
        </>
      }
      childrenEn={
        <>
          <h2>Right of withdrawal</h2>
          <p>
            You have the right to withdraw from this contract within fourteen days
            without giving any reason. The withdrawal period is fourteen days from
            the day on which you or a third party named by you, who is not the
            carrier, took possession of the last goods.
          </p>
          <p>
            To exercise your right of withdrawal, you must inform us (Kubanych
            Susamyrbek uulu, Am Färberhof 9, 91052 Erlangen, Germany, Phone:
            +49 176 24299597, Email: diginutz.e@gmail.com) by means of a clear
            declaration (e.g. letter or email) of your decision to withdraw from
            this contract. You may use the model withdrawal form below, which is
            not mandatory.
          </p>

          <h2>Consequences of withdrawal</h2>
          <p>
            If you withdraw from this contract, we shall reimburse to you all
            payments received from you, including the costs of delivery (with the
            exception of the supplementary costs resulting from your choice of a
            type of delivery other than the least expensive type of standard delivery
            offered by us), without undue delay and in any event not later than
            fourteen days from the day on which we are informed about your decision
            to withdraw from this contract. We will carry out such reimbursement
            using the same means of payment as you used for the initial transaction,
            unless you have expressly agreed otherwise; in any event, you will not
            incur any fees as a result of such reimbursement.
          </p>
          <p>
            We may withhold reimbursement until we have received the goods back or
            you have supplied evidence of having sent back the goods, whichever is
            the earliest.
          </p>
          <p>
            You shall send back the goods or hand them over to us without undue
            delay and in any event not later than fourteen days from the day on
            which you communicate your withdrawal from this contract to us. The
            deadline is met if you send back the goods before the period of fourteen
            days has expired.
          </p>
          <p>You will bear the direct cost of returning the goods.</p>
          <p>
            You are only liable for any diminished value of the goods resulting from
            the handling other than what is necessary to establish the nature,
            characteristics and functioning of the goods.
          </p>

          <h2>Model withdrawal form</h2>
          <div className="rounded-lg border border-border bg-linen/40 p-6 text-sm leading-relaxed">
            <p className="font-semibold">To</p>
            <p className="mt-1">
              Kubanych Susamyrbek uulu<br />
              Am Färberhof 9<br />
              91052 Erlangen<br />
              Germany<br />
              Email: diginutz.e@gmail.com
            </p>
            <p className="mt-4">
              I/We (*) hereby give notice that I/We (*) withdraw from my/our (*)
              contract of sale of the following goods (*)/for the provision of the
              following service (*)
            </p>
            <p className="mt-2">— Ordered on (*)/received on (*)</p>
            <p className="mt-2">— Name of consumer(s)</p>
            <p className="mt-2">— Address of consumer(s)</p>
            <p className="mt-2">
              — Signature of consumer(s) (only if this form is notified on paper)
            </p>
            <p className="mt-2">— Date</p>
            <p className="mt-4 text-muted-foreground">(*) Delete as appropriate.</p>
          </div>

          <h2>Exclusion or early expiry of the right of withdrawal</h2>
          <p>
            The right of withdrawal does not apply to contracts for the supply of
            goods that are not prefabricated and for the manufacture of which an
            individual selection or determination by the consumer is decisive or
            which are clearly tailored to the personal needs of the consumer.
          </p>
        </>
      }
    />
  ),
});
