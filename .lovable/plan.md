# Echte Bezahlung im Checkout

## Kurz vorab: eine Anmerkung zum Vorgehen

Die angefragte Umsetzung (Supabase Edge Function mit `npm:stripe` und Redirect auf `session.url`) passt nicht zu diesem Projekt:

- Das Projekt läuft auf TanStack Start und hat bereits eine eigene Server-Laufzeit. Serverlogik gehört hier in Server-Funktionen (`src/lib/*.functions.ts`), nicht in neue Edge Functions. Bestehende Serverlogik (z. B. `submitOrder`) ist bereits so gebaut.
- Die von der Zahlungsintegration bereitgestellten Schlüssel sind keine echten Stripe-Secret-Keys, sondern Verbindungs-Identifier. Ein direkter `new Stripe(key)`-Aufruf gegen `api.stripe.com` schlägt mit Auth-Fehler fehl. Die Anbindung muss über den Lovable-Zahlungs-Gateway laufen.
- Redirect-Checkout (`session.url`) wird nicht verwendet; das eingebettete Checkout-Formular wird direkt auf `/kasse` gerendert.

Das Ziel — Checkout-Session mit Produkt, Preis und Rückkehr-URL, Kunde bezahlt — wird identisch erreicht, nur über den für diesen Stack korrekten Weg.

## Was gebaut wird

1. **Stripe-Serverhilfsmodul** (`src/lib/stripe.server.ts`)
   Erzeugt den Stripe-Client über den Zahlungs-Gateway (Test- und Live-Umgebung) und liefert lesbare Fehlermeldungen.

2. **Client-Hilfsmodul** (`src/lib/stripe.ts`)
   Lädt Stripe.js und leitet die Umgebung (Test/Live) aus dem Client-Token ab.

3. **Server-Funktion `createCartCheckoutSession`** (`src/lib/payments.functions.ts`)
   - Nimmt den Warenkorb (Produkt-ID, Menge, Konfiguration) sowie E-Mail, Adresse und Versandart entgegen.
   - Berechnet **alle Preise erneut serverseitig** mit exakt derselben Logik wie `submitOrder` heute (Größenvarianten aus der Datenbank, Rabatt, Format-/Rahmen-Aufpreise, Versandkosten). Clientseitige Beträge werden nie vertraut.
   - Da die Preise dynamisch aus dem Katalog kommen, werden die Positionen als dynamische Preise (`price_data`) an Stripe übergeben — je Artikel eine Position mit Name und Betrag, plus eine Versandposition.
   - Legt die Bestellung vorab mit Status `pending` an und hängt die Bestell-ID als Metadatum an die Session, damit die Zahlung später zugeordnet werden kann.
   - Gibt ein `clientSecret` für das eingebettete Formular zurück.

4. **Checkout-UI** (`src/routes/kasse.tsx`)
   - Der Button „Bestellung aufgeben" öffnet nicht mehr direkt die Bestätigungsseite, sondern rendert das eingebettete Zahlungsformular unterhalb der Zusammenfassung.
   - Adress- und Kontaktfelder bleiben wie heute und werden vorher validiert.
   - Nach der Zahlung leitet Stripe zurück auf `/bestellung-bestaetigt?id=…&session_id=…`; der Warenkorb wird dort geleert.

5. **Webhook** (`src/routes/api/public/payments/webhook.ts`)
   Empfängt die Zahlungsbestätigung, prüft die Signatur und setzt die Bestellung von `pending` auf `paid` (bzw. `failed`). Erst dieser Schritt ist der verlässliche Zahlungsnachweis — die Rückkehr im Browser allein reicht nicht.

6. **Testmodus-Hinweis**
   Ein schmaler Banner im Layout, solange die Testumgebung aktiv ist. Im Live-Betrieb unsichtbar.

## Bestellungen und Admin

- `orders` bekommt zwei zusätzliche Felder: die Stripe-Session-ID und die Umgebung (Test/Live), damit Test- und Echtbestellungen unterscheidbar sind.
- `/admin/orders` zeigt den Zahlungsstatus je Bestellung an.

## Was danach noch nötig ist

Zahlungen laufen sofort im Preview mit Testkarten (`4242 4242 4242 4242`). Für echte Zahlungen muss im Payments-Tab die Kontoverifizierung abgeschlossen werden.

## Offene Frage zur Umsatzsteuer

Der Shop verkauft physische Waren (Holzboxen, Rahmen, Schilder) mit Versand. Für solche Produkte kann Stripe die Steuer **berechnen und einziehen** (+0,5 % pro Transaktion), Anmeldung und Abführung bleiben beim Verkäufer. Die vollständige Compliance-Übernahme ist für physische Waren nicht verfügbar.

Aktuell sind die Katalogpreise Bruttopreise inkl. deutscher USt. Vorschlag: zunächst **ohne** automatische Steuerberechnung starten (Preise bleiben brutto wie heute) und die Steuerberechnung später aktivieren, falls Verkäufe ins EU-Ausland über die Lieferschwelle gehen. Sag Bescheid, wenn du sie direkt von Anfang an aktiv haben willst.

## Technische Details

- Kein `supabase/functions/*` und kein direkter `new Stripe(secret)`-Aufruf; alle Stripe-Aufrufe über `createStripeClient(env)` aus `src/lib/stripe.server.ts` (Gateway-Proxy).
- Eingebetteter Checkout: `ui_mode: "embedded_page"` + `return_url`, kein `success_url`/`cancel_url`.
- Neue Pakete: `stripe@22.0.2` (Server), `@stripe/stripe-js@9.2.0` und `@stripe/react-stripe-js@6.2.0` (Client).
- Die Preisberechnung aus `src/lib/orders.functions.ts` wird in ein gemeinsames Servermodul ausgelagert, damit Bestellung und Checkout-Session garantiert identisch rechnen.
- Webhook-Pfad exakt `src/routes/api/public/payments/webhook.ts` mit `?env=sandbox|live`; Signaturprüfung per HMAC-SHA256, Schreibzugriff über den Service-Role-Client.
