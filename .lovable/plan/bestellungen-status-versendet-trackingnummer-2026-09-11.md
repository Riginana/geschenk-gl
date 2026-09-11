# Bestellungen: Status "Versendet" + Trackingnummer

## Ziel

In der Admin-Bestellübersicht kann jede Bestellung einen aktuellen Status bekommen
(Zahlung offen, Bezahlt, Versendet, Abgeschlossen, Storniert) und eine Trackingnummer
mit Versanddienstleister. Beim Setzen auf "Versendet" bekommt der Kunde eine
Versandbestätigung per E-Mail mit anklickbarem Sendungslink.

## Was neu ist

1. **Statusauswahl je Bestellung**
   Direkt in der Bestellkarte ein Auswahlfeld mit allen Status. Änderung wird sofort
   gespeichert, die farbige Markierung oben aktualisiert sich mit.

2. **Trackingfelder**
   - Auswahl Versanddienstleister: DHL (Standard), DHL Express, Hermes, DPD, "Andere"
   - Eingabefeld Sendungsnummer
   - Speichern-Button; danach wird die Nummer als anklickbarer Link zur
     Sendungsverfolgung angezeigt (z. B. DHL-Verfolgungsseite mit der Nummer).
   - Versanddatum wird automatisch festgehalten, sobald Status "Versendet" gesetzt wird.

3. **Versandbestätigung per E-Mail**
   Beim Wechsel auf "Versendet" geht automatisch eine E-Mail an die Bestell-E-Mail-Adresse:
   Betreff "Deine Bestellung ist unterwegs", Anrede mit Namen, Sendungsnummer,
   Verfolgungs-Button, Lieferadresse und Positionsliste. Im Adminbereich gibt es
   zusätzlich "E-Mail erneut senden".
   Wenn keine Trackingnummer eingetragen ist, wird die Mail ohne Sendungslink verschickt.

## Voraussetzung für den E-Mail-Teil

Für den Versand eigener Kunden-E-Mails wird eine eigene Absender-Domain benötigt
(z. B. eine Adresse unter diginutz.de). Die ist bisher nicht eingerichtet. Ich richte
sie im Zuge der Umsetzung mit dir zusammen ein; bis sie bestätigt ist, funktionieren
Status und Trackingnummer bereits, nur der Mailversand startet danach.

## Technische Details

- Migration: `orders` bekommt `tracking_number text`, `tracking_carrier text`,
  `shipped_at timestamptz`, `shipping_email_sent_at timestamptz` (alle nullbar,
  additiv, keine bestehenden Spalten geändert). RLS bleibt wie bisher
  (kein öffentlicher Lesezugriff); Änderungen laufen ausschließlich über Admin-Serverfunktionen.
- `src/lib/admin-config.functions.ts`:
  - `AdminOrderRow` + Select um die neuen Felder erweitern.
  - Neue Serverfunktion `adminUpdateOrderStatus` (Status, tracking_number, tracking_carrier)
    mit `requireSupabaseAuth` + `requireAdmin`, Zod-Validierung des Status gegen das
    bestehende `order_status`-Enum, setzt `shipped_at` beim ersten Wechsel auf `shipped`
    und stößt die Versandmail an (Idempotenzschlüssel `order-shipped-<orderId>`).
  - Neue Serverfunktion `adminResendShippingEmail`.
- `src/lib/tracking.ts`: Carrier-Liste + `trackingUrl(carrier, number)` (DHL:
  `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=<nr>`,
  weitere analog), genutzt in Admin-UI und E-Mail-Template.
- `src/routes/admin/orders.tsx`: Status-Select, Carrier-Select, Tracking-Input,
  Speichern-Button, Query-Invalidierung von `["admin-orders"]`, Toast-Feedback.
- E-Mail: Lovable-Cloud-Mailinfrastruktur einrichten (Domain-Setup, Infra, Scaffold),
  Template `src/lib/email-templates/order-shipped.tsx` im Shop-Design, Registrierung in
  `registry.ts`, Versand serverseitig aus der Statusfunktion.
