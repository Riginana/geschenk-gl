# Holzbox: Größen + Motive mit eigenen Preisen

Holzbox-Produkte haben aktuell weder Größen- noch Motivauswahl (nur Schiebebox hat das). Sie bekommen dieselbe Konfiguration — plus einen Preisaufschlag pro Motiv, damit "Motiv 2 – Wunschtext" 4 € mehr kostet.

## Preislogik

Preis = Größenpreis + Aufschlag des gewählten Motivs.

| Größe | Motiv 1, 3, 4 | Motiv 2 (Wunschtext) |
|---|---|---|
| S | 24 € | 28 € |
| M | 28 € | 32 € |
| L | 32 € | 36 € |

Umgesetzt als: Größenpreise 24 / 28 / 32 € und Motiv-Aufschlag 0 € (Motive 1, 3, 4) bzw. +4 € (Motiv 2). Alles im Adminbereich frei änderbar — auch ein anderer Aufschlag oder Aufschläge bei weiteren Motiven.

## Was gebaut wird

1. **Datenbank**: neues Feld "Aufpreis" bei Motiven (Standard 0, ändert für Schiebebox nichts). Für die 5 aktiven Holzbox-Produkte werden Größen S/M/L und 4 Motive angelegt (Motiv 2 mit Wunschtext-Pflichtfeld und +4 €).
2. **Produktseite**: Holzbox zeigt jetzt Größen- und Motivauswahl wie Schiebebox. Der angezeigte Preis aktualisiert sich sofort beim Wechsel von Größe oder Motiv; der Motiv-Aufpreis wird beim jeweiligen Motiv sichtbar ausgewiesen (z. B. "+4,00 €").
3. **Warenkorb/Kasse**: Der Aufpreis fließt in die serverseitige Preisprüfung ein, damit Stripe exakt denselben Betrag berechnet.
4. **Adminpanel** (`/admin/products/[id]`): Der bestehende Konfigurations-Editor bekommt ein Preisfeld pro Motiv; Titel, Beschreibung, Wunschtext-Einstellungen, Reihenfolge, Aktiv-Status und Motivbild-Upload sind bereits vorhanden und gelten nun auch für Holzbox. Der Button "Standardwerte anlegen" erzeugt für Holzbox das oben genannte Preisraster.

## Technische Details

- Migration: `ALTER TABLE public.product_motifs ADD COLUMN price_delta_cents integer NOT NULL DEFAULT 0`.
- Daten-Insert (separater Schritt) für die 5 Holzbox-Produkte: `product_size_variants` (S 2400, M 2800, L 3200) und `product_motifs` (4 Motive, Motiv 2 `requires_custom_text = true`, `price_delta_cents = 400`).
- `src/lib/product-config.ts`: `CONFIGURABLE_CATEGORY` wird zu einer Liste (`schiebebox`, `holzbox`); `Motif`-Typ erhält `price_delta_cents`; neue Helper `unitPriceCents(size, motif)` und angepasstes `fromPriceCents` (günstigste Kombination) für "Ab …"-Labels.
- `product-config.functions.ts` / `admin-config.functions.ts`: `price_delta_cents` in Spaltenlisten und Zod-Schema.
- `src/routes/product.$id.tsx`: Preisberechnung nutzt `unitPriceCents`; `motifDelta` wandert in die Personalisierungsdaten des Warenkorbs.
- `src/components/product/motif-selector.tsx`: Aufpreis-Badge pro Motiv.
- `src/lib/order-pricing.server.ts`: Zweig für `sizeId` lädt zusätzlich das Motiv (`motifId`), prüft Produktzugehörigkeit und addiert `price_delta_cents` vor dem Rabatt.
- `src/components/admin/product-config-editor.tsx`: Euro-Eingabefeld "Aufpreis" pro Motiv; Seed-Defaults abhängig von der Produktkategorie.
