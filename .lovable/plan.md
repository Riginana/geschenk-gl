# Einheitliche "Ab"-Preise in Katalog und Startseite

## Was falsch ist

Auf den Produktkarten (Shop, Startseite, Wunschliste) steht bei sehr vielen Produkten 9,10 €. Das ist der Basispreis 13,00 € minus 30 % — ein reiner Platzhalterwert aus der Produkttabelle. Er stimmt nicht mit dem Preis überein, den die Produktseite anzeigt und den die Kasse berechnet:

- **Bilderrahmen** (102 Produkte): Der echte Preis kommt aus der Rahmen-Preistabelle, günstigste Kombination A5 / ohne Bilderrahmen = 17,00 € → mit Rabatt 11,90 €. Karte zeigt aber 9,10 €.
- **Holzplatte** (9 Produkte): Echter Preis kommt aus der Holzplatten-Preistabelle, günstigste Größe 11 × 15 cm = 10,50 €. Karte zeigt 10,50 € nur zufällig nicht — hier rechnet sie 15,00 € − 30 % = 10,50 €, kann aber bei Preisänderungen im Admin sofort auseinanderlaufen.
- **Schiebebox / Holzbox**: Diese nutzen bereits die Größen- und Motivpreise und sind korrekt.

Zusätzlich sortiert der Shop-Filter "Preis aufsteigend/absteigend" nach dem Basispreis, also nach demselben falschen Wert.

## Was gebaut wird

1. Eine gemeinsame Funktion "günstigster Preis eines Produkts", die je nach Kategorie die richtige Quelle nutzt:
   - Schiebebox / Holzbox → günstigste Größe + günstigster Motivaufschlag (wie bisher)
   - Bilderrahmen → günstigster Eintrag der Rahmen-Preistabelle (produktspezifischer Preis schlägt globalen)
   - Holzplatte → günstigster Endpreis der Holzplatten-Preistabelle
   - alle übrigen → Basispreis
2. Die Produktkarte lädt zusätzlich die Rahmen- und Holzplatten-Preise und zeigt darüber den korrekten "Ab"-Preis inklusive Rabattdarstellung (durchgestrichener Originalpreis nur, wenn es wirklich einen Rabatt gibt — bei Holzplatte kommt der Rabatt aus der Preistabelle, nicht aus dem Produktrabatt).
3. Die Preissortierung im Shop nutzt denselben berechneten Preis statt des Basispreises.
4. Damit im Admin und in Auswertungen keine irreführenden 13,00 € stehen bleiben, wird der Basispreis der Bilderrahmen-Produkte auf den günstigsten Rahmenpreis (17,00 €) gesetzt. Er dient dann nur noch als Rückfallwert; maßgeblich bleiben die Preistabellen.

## Technische Details

- `src/lib/catalog-pricing.ts` (neu): `catalogFromPrice(product, { sizes, motifs, framePrices, holzplattePrices })` liefert `{ listCents, finalCents, discountPercent }`. Nutzt `fromPriceCents`, `resolveFramePriceCents` bzw. `resolveHolzplattePrice` + `finalPriceCents` und `calculateDiscountedPrice`.
- `src/components/product-card.tsx`: ersetzt die bisherige Ad-hoc-Rechnung; lädt `frame-prices.functions` / `holzplatte-prices.functions` per React Query (aktiviert nur für die jeweilige Kategorie, Ergebnis wird durch den Query-Cache pro Seite nur einmal geladen).
- `src/routes/shop.index.tsx`: Sortierung `price-asc` / `price-desc` über denselben Helper.
- Datenmigration (separater Schritt): `UPDATE public.products SET base_price_cents = 1700 WHERE category = 'bilderrahmen'` — keine Schemaänderung.
- Keine Änderung an `src/lib/order-pricing.server.ts`; die serverseitige Preisprüfung ist bereits korrekt.
