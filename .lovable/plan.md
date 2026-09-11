# Rahmenpreise getrennt nach Papier und Holz

## Ziel

Die Rahmenvarianten und Größen bleiben genau wie jetzt auf der Website. Nur die Preise sollen sich unterscheiden: eine Preistabelle für Rahmen mit Papier-Einlage, eine für Holz. Beide lassen sich im Admin massenhaft ändern.

## So funktioniert es

1. Jedes Bilderrahmen-Produkt bekommt eine Materialangabe: **Papier** oder **Holz**.
   - Die Zuordnung wird einmalig automatisch aus Produktname und Beschreibung abgeleitet (Stichworte wie "Papier", "Print", "Poster" → Papier; sonst Holz).
   - Im Produkt-Editor lässt sich das Material jederzeit korrigieren; in der Produktliste gibt es eine Massenzuweisung für mehrere ausgewählte Produkte.
2. Die Seite "Rahmenpreise" bekommt oben zwei Reiter: **Papier | Holz**.
   - Darunter die gewohnte Tabelle Größe (A5/A4/A3) × Rahmenvariante.
   - Eine Änderung gilt sofort für alle Rahmen-Produkte mit diesem Material.
3. Produktspezifische Ausnahmen bleiben wie bisher möglich (Auswahl "Einzelnes Produkt") und haben Vorrang vor dem Materialpreis.
4. Preisreihenfolge auf Produktseite, im Katalog und beim Bezahlen: Produkt-Ausnahme → Materialpreis → bisheriger allgemeiner Preis.
5. Die heutigen allgemeinen Preise werden als Startwerte für beide Materialien übernommen, damit sich zunächst nichts ändert.

Nach der Umstellung prüfen Sie bitte kurz die automatische Zuordnung in der Produktliste und korrigieren einzelne Produkte, falls nötig.

## Technische Umsetzung

- Migration:
  - `products.frame_material text not null default 'holz'` (erlaubt: `papier`, `holz`), Backfill per Namens-/Beschreibungs-Heuristik.
  - `frame_prices.material text null` + eindeutiger Index auf (`product_id`, `material`, `size`, `variant`) via `coalesce`; Bestandszeilen bleiben als globaler Fallback (`material = null`).
- `src/lib/frame-pricing.ts`: `FRAME_MATERIALS` + Labels, `resolveFramePriceCents(rows, productId, material, size, variant)` mit Kaskade Produkt → Material → global.
- Aufrufer nachziehen: `src/routes/product.$id.tsx`, `src/routes/shop.$slug.tsx`, `src/lib/catalog-pricing.ts` (+ `.query.ts`, `frame_material` mitladen), `src/lib/order-pricing.server.ts` (Material aus dem Produkt lesen, nicht aus der Client-Eingabe).
- `src/lib/frame-prices.functions.ts`: `material` im Upsert-/Delete-Schema; Materialzeilen als Massenpreis.
- `src/lib/admin.functions.ts`: `adminSetFrameMaterial(productIds, material)` für die Massenzuweisung.
- `src/routes/admin/frame-prices.tsx`: Material-Reiter über der Tabelle; `src/routes/admin/products/$id.tsx` und `products/index.tsx`: Materialauswahl bzw. Massenzuweisung.
