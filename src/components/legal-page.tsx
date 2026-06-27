import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <h1 className="font-serif text-4xl text-walnut sm:text-5xl">{title}</h1>
      <div className="prose mt-8 max-w-none text-sm text-foreground/85 [&_h2]:font-serif [&_h2]:text-walnut [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3">
        {children}
      </div>
      <p className="mt-12 text-sm text-foreground/85 whitespace-pre-line">
        {`Allgemeine Geschäftsbedingungen & Informationen zum Datenschutz & Widerrufsbelehrung & Widerrufsformular
        Inhaltsverzeichnis
        A. Allgemeine Geschäftsbedingungen
        1. Geltungsbereich
        2. Vertragsschluss
        3. Widerrufsrecht
        4. Preise und Zahlungsbedingungen 5. Liefer- und Versandbedingungen 6. Eigentumsvorbehalt
        7. Mängelhaftung
        8. Anwendbares Recht
        9. Alternative Streitbeilegung
        B. Informationen zum Datenschutz
        1. Information über die Erhebung personenbezogener Daten und Kontaktdaten des Verantwortlichen
        2. Kontaktaufnahme
        3. Datenverarbeitung zur Bestellabwicklung
        4. Rechte des Betroffenen
        5. Dauer der Speicherung personenbezogener Daten 6. Hinweis auf die Etsy-Datenschutzerklärung
        C. Widerrufsbelehrung
        1. Einleitung
        2. Widerrufsrecht
        3. Folgen des Widerrufs
        4. Ausschluss bzw. vorzeitiges Erlöschen des Widerrufsrechts
        D. Widerrufsformular
        ... (Rest des Textes) ...`}
      </p>
    </div>
  );
}
