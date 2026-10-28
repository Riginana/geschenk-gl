# Benachrichtigung bei neuer Bestellung

## Heute
Es gibt keine automatische Nachricht an Sie. Neue Bestellungen sieht man nur, wenn man Admin → Bestellungen öffnet (und ggf. in der Stripe-Übersicht / Stripe-App).

## Vorschlag
1. **E-Mail an den Shop** sobald eine Zahlung erfolgreich ist: an kontakt.diginutz@gmail.com, Betreff „Neue Bestellung #XXXXXXXX – 34,00 €", mit Kundenname, Adresse, Artikeln inkl. Personalisierung und einem Knopf „Im Admin öffnen". Wird pro Bestellung nur einmal gesendet.
2. **Zähler im Admin-Menü**: neben „Bestellungen" eine Zahl mit offenen (neuen, noch nicht versendeten) Bestellungen.

## Hinweis
Der E-Mail-Versand läuft über notify.diginutz.de — die DNS-Einträge dafür sind noch nicht vollständig. Bis dahin können Sie zusätzlich in der Stripe-App Push-Nachrichten für Zahlungen aktivieren (sofort möglich, ohne Änderung am Shop).

## Technisch
- Neues Template `order-new-admin` in src/lib/email-templates, im Registry registriert.
- Versand im bestehenden Stripe-Webhook nach Status „paid", Idempotenzschlüssel `order-new-admin-<orderId>`.
- Empfänger aus src/config/contact.ts.
- Admin-Menü (src/routes/admin/route.tsx): Zählabfrage auf orders mit Status „paid"/neu.
- Keine Datenbankänderung.
