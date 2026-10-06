# Bestellung: E-Mail „Bestellung erhalten" beim Status „Abgeschlossen"

## Ziel

Zusätzlich zur Versandbestätigung bekommt der Kunde eine weitere E-Mail, sobald die
Bestellung als „Abgeschlossen" (Zustellung erhalten) markiert wird. In der Admin-Ansicht
gibt es dafür auch einen „E-Mail erneut senden"-Button.

## Was neu ist

1. **Automatische E-Mail beim Status „Abgeschlossen"**
   Beim ersten Wechsel des Status auf „Abgeschlossen" geht automatisch eine E-Mail an die
   Bestell-E-Mail-Adresse: Betreff „Deine Bestellung wurde zugestellt", Anrede mit Namen,
   Positionsliste, Lieferadresse und freundlicher Abschlusstext (Danke + Hinweis auf
   Bewertung/Kontakt).

2. **Erneut senden in der Admin**
   Neuer Button „Zustell-E-Mail erneut senden" in der Bestellkarte, analog zum bestehenden
   Button für die Versandbestätigung.

3. **Zeitpunkt wird festgehalten**
   In der Bestellung wird gespeichert, wann die Zustell-E-Mail verschickt wurde
   (sichtbar in der Bestellkarte).

## Technische Details

- Migration: `orders` bekommt `delivery_email_sent_at timestamptz` (nullbar, additiv).
- Neues Template `src/lib/email-templates/order-delivered.tsx` im gleichen Shop-Design
  wie die Versandbestätigung; Registrierung in `registry.ts` als `order-delivered`.
- `src/lib/admin-config.functions.ts`:
  - `AdminOrderRow` + `ORDER_COLS` um `delivery_email_sent_at` erweitern.
  - `adminUpdateOrder`: beim ersten Wechsel auf `done` E-Mail senden
    (Idempotenzschlüssel `order-delivered-<orderId>`), Zeitstempel speichern.
  - Neue Serverfunktion `adminResendDeliveryEmail` (analog `adminResendShippingEmail`).
- `src/routes/admin/orders.tsx`: Button „Zustell-E-Mail erneut senden" + Anzeige des
  Versanddatums der Zustell-E-Mail.
- Versand läuft über die bestehende Lovable-E-Mail-Infrastruktur (notify.diginutz.de);
  kein neues Setup nötig.
