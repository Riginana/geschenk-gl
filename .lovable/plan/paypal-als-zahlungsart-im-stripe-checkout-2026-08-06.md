# PayPal als Zahlungsart im Stripe-Checkout

Ziel: PayPal erscheint im eingebetteten Bezahlformular auf `/kasse` — über dieselbe Stripe-Checkout-Session, keine zweite Integration.

## Änderung im Code

Einzige Codeänderung in `src/lib/payments.functions.ts` (Session-Erstellung):

- `payment_method_types: ["card", "paypal"]` an `stripe.checkout.sessions.create` ergänzen.
- Währung bleibt `eur`, Modus bleibt `payment` — beides ist PayPal-kompatibel.
- Falls Stripe die Session mit „paypal not activated“ ablehnt, fällt der Code automatisch auf `["card"]` zurück und protokolliert den Grund, damit die Kasse nie blockiert.

Server-Funktion, Bestell-Anlage (`pending`) und Webhook (`pending → paid`) bleiben unverändert — PayPal löst dieselben `checkout.session.*`-Events aus.

## Aktivierung im Stripe-Konto

PayPal muss im Stripe-Konto unter Settings → Payment methods freigeschaltet sein. Das Sandbox-Konto dieses Projekts wird von Lovable verwaltet und ist noch nicht mit einem eigenen Stripe-Konto verbunden (Schritt „Connect your sandbox“ offen), d. h. der Zugriff auf diese Einstellung ist derzeit nicht möglich. Ich prüfe beim Umsetzen per API, ob PayPal für die Sandbox verfügbar ist:

- Verfügbar → PayPal erscheint sofort im Testformular.
- Nicht verfügbar → der Code ist fertig und aktiv, PayPal schaltet sich frei, sobald das Stripe-Konto verbunden und PayPal dort aktiviert ist. Du bekommst dann eine kurze Anleitung dazu.

## Test

Nach der Änderung teste ich `/kasse` im Browser: Warenkorb füllen, Formular absenden, prüfen ob PayPal im eingebetteten Formular angeboten wird, Sandbox-Zahlung durchführen und kontrollieren, dass die Bestellung im Admin von „Zahlung offen“ auf „Bezahlt“ wechselt. Ergebnis inklusive Screenshot melde ich zurück.

Hinweis: Stripes PayPal-Sandbox erfordert ein verknüpftes PayPal-Sandbox-Konto. Ist das im verwalteten Testkonto nicht hinterlegt, bestätige ich stattdessen, dass die Session PayPal korrekt anfordert, und die Statuslogik über eine Kartenzahlung (identischer Webhook-Pfad).
