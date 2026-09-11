# Rahmenpreise nach Material trennen + Massenpreise für Holzbox

## Ziel

1. Im Adminbereich "Rahmenpreise" werden Bilderrahmen-Produkte nach dem Innenmaterial getrennt: **Papier**, **Holz**, **HDF**. Preise lassen sich pro Material für alle Produkte dieses Materials auf einmal ändern.
2. Neuer Adminbereich für **Holzbox** (und Schiebebox): Größen- und Motivpreise für alle Produkte der Kategorie auf einmal ändern.

## Teil 1 — Rahmen nach Material

- Jedes Bilderrahmen-Produkt bekommt ein Feld "Innenmaterial" mit den Werten Papier / Holz / HDF (Standard: Papier). Im Produkt-Editor auswählbar.
- Die Preistabelle bekommt eine Material-Ebene. Die Seite "Rahmenpreise" zeigt oben drei Reiter: Papier | Holz | HDF. Pro Reiter die bekannte Tabelle Größe (A5/A4/A3) × Rahmenvariante.
- Eine Änderung im Reiter gilt sofort für alle Produkte mit diesem Innenmaterial.
- Produktspezifische Ausnahmen bleiben möglich (Auswahl "Einzelnes Produkt" wie bisher); sie überschreiben den Materialpreis, der Zurücksetzen-Knopf entfernt die Ausnahme wieder.
- Preisreihenfolge auf der Produktseite und beim Bezahlen: Produkt-Ausnahme → Materialpreis → bisheriger allgemeiner Preis.
- Bestehende allgemeine Preise werden bei der Umstellung als Papier-Preise übernommen, damit sich nichts ändert, bis Sie neue Werte eintragen.

## Teil 2 — Massenpreise Holzbox

- Neue Adminseite "Holzbox-Preise" (im Menü neben Rahmenpreise), mit Umschalter Holzbox / Schiebebox.
- Tabelle 1: Größen S / M / L mit Preis — gilt für alle Produkte der Kategorie.
- Tabelle 2: Motive 1–4 mit Aufpreis (z. B. Wunschtext +4 €) — ebenfalls für alle Produkte der Kategorie.
- Speichern schreibt die Werte in alle aktiven Produkte der Kategorie (nach Größen-Label bzw. Motiv-Nummer). Produkte ohne diese Größen/Motive werden dabei angelegt.
- Die bestehende Einzelbearbeitung pro Produkt bleibt unverändert erhalten; wer dort abweichende Werte setzt, wird beim nächsten Massenspeichern überschrieben (Hinweis wird in der Oberfläche angezeigt).

## Technische Umsetzung

- Migration:
  - `products.frame_material text not null default 'papier'` (check: papier|holz|hdf).
  - `frame_prices.material text null` + eindeutiger Index über (`product_id`, `material`, `size`, `variant`); bestehende globalen Zeilen auf `material = 'papier'` setzen und zusätzlich als Fallback-Kopie behalten.
- `src/lib/frame-pricing.ts`: `FRAME_MATERIALS` + Labels; `resolveFramePriceCents(rows, productId, material, size, variant)` mit Kaskade Produkt → Material → global. Alle Aufrufer (PDP, `order-pricing.server.ts`, Katalogpreise) mitziehen.
- `src/lib/frame-prices.functions.ts`: `material` in Upsert/Delete-Schema; Admin-Prüfung unverändert.
- `src/routes/admin/frame-prices.tsx`: Material-Reiter über der Tabelle.
- Neue Serverfunktion `adminBulkApplyConfig` in `src/lib/admin-config.functions.ts`: setzt Größenpreise und Motiv-Aufpreise für alle aktiven Produkte einer Kategorie (`product_size_variants`, `product_motifs`), inkl. Anlegen fehlender Zeilen.
- Neue Route `src/routes/admin/box-prices.tsx` + Link in `src/routes/admin/route.tsx`.
- Produkt-Editor `src/routes/admin/products/$id.tsx`: Auswahl Innenmaterial für Bilderrahmen.
