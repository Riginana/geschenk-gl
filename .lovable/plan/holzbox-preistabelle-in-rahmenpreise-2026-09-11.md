# Holzbox-Preistabelle in "Rahmenpreise"

Neben den bestehenden Tabellen (Bilderrahmen, Holzplatte) kommt eine eigene Holzbox-Tabelle mit den Größen S, M, L, den Motiv-Aufpreisen und Rabatt-Feldern.

## Was du bekommst

- Neuer Abschnitt "Holzbox-Preise" auf der Seite Rahmenpreise.
- Auswahl oben: "Alle Holzbox-Produkte" oder ein einzelnes Produkt.
  - "Alle": Speichern setzt die Werte für jedes Holzbox-Produkt.
  - Einzelnes Produkt: nur dieses Produkt wird geändert.
- Tabelle mit den Größen S, M, L: je Zeile Preis in €, Rabatt in % und der berechnete Endpreis.
- Darunter eine Liste der Motive (z. B. Wunschtext) mit einem Aufpreis-Feld je Motiv.
- Buttons: "Rabatt für alle Felder setzen", "Speichern", "Zurücksetzen".
- Hinweis, wenn ein Produkt abweichende Werte hat.

## Preisregel auf der Website

Endpreis = (Größenpreis + Motiv-Aufpreis) abzüglich des Rabatts der gewählten Größe. Dieser Rabatt ersetzt bei Holzbox den bisherigen allgemeinen 30-%-Produktrabatt. Damit sich sofort nichts ändert, werden die vorhandenen Größen einmalig auf den heute wirksamen Rabattwert gesetzt.

Bilderrahmen, Holzplatte und Schiebebox bleiben unverändert.

## Technische Umsetzung

- Migration: Spalte `discount_percent` (integer, default 0, CHECK 0–100) auf `product_size_variants`.
- Datenschritt: bestehende Holzbox-Größen auf den aktuell wirksamen Rabatt (30) setzen, damit Preise stabil bleiben.
- Serverfunktionen in `src/lib/admin-config.functions.ts` erweitern:
  - `adminListHolzboxConfig` — Holzbox-Produkte mit Größen und Motiven, plus Kennzeichnung abweichender Produkte.
  - `adminBulkUpsertHolzbox` — Größenpreise/Rabatte und Motiv-Aufpreise entweder für ein Produkt oder für alle Holzbox-Produkte schreiben (Zuordnung über Größen-Label bzw. Motiv-Nummer, fehlende Zeilen werden angelegt). Admin-Prüfung wie bei den Rahmenpreisen.
- Neue Komponente `src/components/admin/holzbox-price-table.tsx`, eingebunden in `src/routes/admin/frame-prices.tsx` analog zu `HolzplattePriceTable`.
- Preislogik: `src/lib/product-config.ts` (`configuredPriceCents`, Minimalpreis) um den Größenrabatt erweitern; `src/lib/catalog-pricing.ts` und `src/routes/product.$id.tsx` nutzen für Holzbox diesen Rabatt statt `discount_percent` des Produkts.
- Serverseitige Bestellprüfung in `src/lib/order-pricing.server.ts` auf dieselbe Formel umstellen.
- React-Query-Caches (`product-config`, `catalog-pricing`, Admin-Listen) nach dem Speichern invalidieren, damit die Website sofort aktualisiert.
