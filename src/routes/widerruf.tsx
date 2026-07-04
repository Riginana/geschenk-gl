import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/widerruf")({
  head: () => ({
    meta: [
      { title: "Widerrufsrecht | DigiNutz" },
      { name: "description", content: "Widerrufsbelehrung und Hinweis zum Ausschluss des Widerrufsrechts bei personalisierten Produkten." },
      { property: "og:url", content: "/widerruf" },
    ],
    links: [{ rel: "canonical", href: "/widerruf" }],
  }),
  component: () => (
    <LegalPage
      title="Widerrufsrecht"
      titleEn="Right of Withdrawal"
      children={
        <>
          <h2>Widerrufsbelehrung</h2>
          <p>Verbraucher haben das Recht, binnen 14 Tagen ohne Angabe von Gründen den Vertrag zu widerrufen.</p>
          <h2>Hinweis bei personalisierten Produkten</h2>
          <p>Bei nach Kundenspezifikation gefertigten Waren (z.B. Geldgeschenke mit Namen, Datum oder individuellem Text) ist das Widerrufsrecht gemäß § 312g Abs. 2 Nr. 1 BGB ausgeschlossen.</p>
        </>
      }
      childrenEn={
        <>
          <h2>Withdrawal notice</h2>
          <p>Consumers have the right to withdraw from the contract within 14 days without giving any reason.</p>
          <h2>Note on personalized products</h2>
          <p>For goods manufactured to customer specifications (e.g. money gifts with names, dates or individual text), the right of withdrawal is excluded under § 312g (2) no. 1 of the German Civil Code (BGB).</p>
        </>
      }
    />
  ),
});
