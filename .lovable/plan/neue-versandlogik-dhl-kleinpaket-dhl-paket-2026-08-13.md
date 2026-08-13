# Neue Versandlogik: DHL Kleinpaket & DHL Paket

## Tarife (zentral definiert)

| Versandart | Deutschland | EU | Schweiz |
|---|---|---|---|
| DHL Kleinpaket — Standard | 3,90 € (ab 50 € Warenwert kostenlos) | 8,49 € | 10,99 € |
| DHL Paket — Schneller Versand | 9,00 € | 13,50 € | 22,00 € |

Die Gratis-Versand-Aktion gilt ausschließlich für Kleinpaket + Deutschland ab 50 € Warenwert (ohne Versand). Sinkt der Warenkorbwert unter 50 €, greift wieder 3,90 €.

## Seite /versand

- Die Blöcke zu Versandkosten/Versandländern werden durch zwei Karten im bestehenden Kartenstil ersetzt (eine je Versandart), jeweils mit den drei Zonenpreisen als kleine Preistabelle.
- Neben dem DE-Preis der Standard-Karte ein Badge „ab 50 € Bestellwert versandkostenfrei“.
- Zweisprachig (DE/EN) wie die restliche Seite.

## Warenkorb (/warenkorb)

- Neuer Block „Versand“ in der Zusammenfassung: Radio-Buttons für die Versandart und eine Auswahl für das Lieferland (Deutschland / EU / Schweiz).
- Standard: Deutschland + DHL Kleinpaket.
- Zeilen: Zwischensumme, Versandkosten, Gesamtsumme — sofortige Neuberechnung ohne Reload.
- Bei aktiver Aktion: Hinweis „Versandkostenfrei“ statt Preis. Fehlen noch Euro bis 50 €, erscheint ein Fortschrittshinweis „Noch X € bis zum kostenlosen Versand!“ inkl. Fortschrittsbalken (nur bei Kleinpaket + Deutschland).

## Kasse (/kasse)

- Die bisherige Auswahl Standard/Express wird durch dieselben zwei Versandarten ersetzt; die Auswahl aus dem Warenkorb wird übernommen und bleibt hier änderbar.
- Lieferland-Auswahl steuert Versandzone und setzt das Länderfeld der Adresse vor.
- Bestellübersicht zeigt Zwischensumme + Versandkosten (bzw. „Versandkostenfrei“) = Gesamtsumme.

## Zahlung

- Der an Stripe (Karte/PayPal/Klarna) übergebene Betrag enthält die serverseitig neu berechneten Versandkosten — auch 0 €, wenn die Aktion greift.
- Versandkosten werden weiterhin serverseitig aus Versandart + Zone + geprüftem Warenwert berechnet; Clientwerte werden nicht vertraut.

## Technische Umsetzung

- Neu: `src/lib/shipping.ts` — Zonen (`de` | `eu` | `ch`), Methoden (`kleinpaket` | `paket`), Tariftabelle, `computeShippingCents(method, zone, subtotalCents)`, Schwelle 5000 Cent. Von Client und Server gemeinsam genutzt.
- `src/contexts/cart.tsx`: Versandart und Zone als Auswahlzustand ergänzen (in `localStorage` persistiert), damit /warenkorb und /kasse dieselbe Auswahl teilen.
- `src/lib/checkout-schema.ts`: `shippingMethod` auf die neuen Werte umstellen, `shippingZone` ergänzen.
- `src/lib/order-pricing.server.ts`: `computeShippingCents` durch die geteilte Funktion ersetzen, `priceCart` nimmt zusätzlich die Zone.
- `src/lib/payments.functions.ts`: Zone durchreichen, Versand-Line-Item mit korrektem Namen („DHL Kleinpaket — Standard“ / „DHL Paket — Schneller Versand“), Metadaten um die Zone ergänzen.
- Neue i18n-Keys in `src/i18n/de.ts` / `en.ts` für Versandarten, Zonen, Aktionstext und Fortschrittshinweis.
- Bestehende Bestellungen mit alten Methodenwerten bleiben unberührt (nur Anzeige-Text im Admin-Bereich fällt auf den Rohwert zurück).
