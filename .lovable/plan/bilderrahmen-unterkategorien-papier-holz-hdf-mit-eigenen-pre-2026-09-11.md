# Bilderrahmen: Unterkategorien Papier / Holz / HDF mit eigenen Preisen

## Ziel

Die Kategorie **Bilderrahmen** bekommt im Admin drei Unterkategorien: **Papier**, **Holz**, **HDF**. Größen und Rahmenvarianten bleiben auf der Website unverändert — nur die Preise werden je Unterkategorie getrennt gepflegt.

## So funktioniert es

1. Produktliste `/admin/products`
   - Jedes Bilderrahmen-Produkt zeigt seine Unterkategorie (Papier / Holz / HDF).
   - Filter nach Unterkategorie.
   - Mehrere Produkte auswählen und per Massenzuweisung einer Unterkategorie zuordnen.
2. Produkt-Editor `/admin/products/[id]`
   - Auswahlfeld "Unterkategorie" (nur bei Kategorie Bilderrahmen sichtbar).
3. Seite "Rahmenpreise"
   - Oben drei Reiter: **Papier | Holz | HDF**.
   - Darunter die gewohnte Tabelle Größe (A5/A4/A3) × Rahmenvariante.
   - Eine Änderung gilt sofort für alle Produkte dieser Unterkategorie.
   - Produktspezifische Ausnahmen bleiben wie bisher möglich und haben Vorrang.
4. Preisreihenfolge auf Produktseite, im Katalog und beim Bezahlen:
   Produkt-Ausnahme → Preis der Unterkategorie → bisheriger allgemeiner Preis.
5. Startwerte: Die heutigen allgemeinen Preise werden für alle drei Reiter übernommen, damit sich zunächst nichts ändert. Neue Produkte starten in "Holz" und können umgestellt werden.

Nach der Umstellung ordnen Sie die Produkte in der Liste den richtigen Unterkategorien zu (Massenzuweisung) und tragen dann je Reiter die Preise ein.

## Technische Umsetzung

- Migration:
  - `products.frame_material text not null default 'holz'` (erlaubt: `papier`, `holz`, `hdf`).
  - `frame_prices.material text null` + eindeutiger Index auf (`coalesce(product_id)`, `coalesce(material)`, `size`, `variant`); bestehende Zeilen bleiben als globaler Fallback (`material = null`).
- `src/lib/frame-pricing.ts`: `FRAME_MATERIALS` + Labels; `resolveFramePriceCents(rows, productId, material, size, variant)` mit Kaskade Produkt → Material → global.
- Aufrufer nachziehen: `src/routes/product.$id.tsx`, `src/routes/shop.$slug.tsx`, `src/lib/catalog-pricing.ts` und `catalog-pricing.query.ts` (`frame_material` mitladen), `src/lib/order-pricing.server.ts` (Material serverseitig aus dem Produkt lesen, nie aus der Client-Eingabe).
- `src/lib/frame-prices.functions.ts`: `material` in Upsert-/Delete-Schema.
- `src/lib/admin.functions.ts`: `adminSetFrameMaterial(productIds, material)` für die Massenzuweisung; `frame_material` in Produktliste und Produkt-Update.
- UI: Reiter in `src/routes/admin/frame-prices.tsx`, Feld in `src/routes/admin/products/$id.tsx`, Spalte + Filter + Massenaktion in `src/routes/admin/products/index.tsx`.
