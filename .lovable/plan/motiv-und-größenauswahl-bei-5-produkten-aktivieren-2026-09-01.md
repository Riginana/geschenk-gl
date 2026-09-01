# Motiv- und Größenauswahl bei 5 Produkten aktivieren

## Was ich geprüft habe

Das aktuell geöffnete Produkt `taufe-geschenk-schiebbox` hat in der Datenbank die Kategorie `other` — nicht `schiebebox`. Größen- und Motivauswahl wird nur für die Kategorien `schiebebox` und `holzbox` gerendert, deshalb erscheint dort nichts. Zusätzlich hat dieses Produkt 0 Größen und 0 Motive hinterlegt.

Betroffen sind genau 5 aktive Produkte mit Kategorie `other`:

- taufe-geschenk-schiebbox
- konfirmation-geschenk-box
- kommunion-geschenk-pigeon
- firmung-geschenk-box
- baby-geschenk-dino-rosa

Alle 7 `schiebebox`- und alle 5 `holzbox`-Produkte haben Größen/Motive korrekt hinterlegt und funktionieren.

## Was gemacht wird

1. Die 5 Produkte auf die richtige Kategorie setzen. Vorschlag anhand von Name/Slug: `taufe-geschenk-schiebbox` → `schiebebox`, die übrigen vier → `holzbox` (alle sind laut Titel "Holzbox").
2. Für jedes dieser Produkte die Standard-Konfiguration anlegen, sofern noch nicht vorhanden:
   - Größen S / M / L mit 24 € / 28 € / 32 €
   - 4 Motive, Motiv 2 = "Wunschtext" mit Pflicht-Textfeld und +4 € Aufschlag
3. Prüfen, dass auf der Produktseite beide Dropdowns (Größe, Motiv) sowie die Preisberechnung inkl. Motiv-Aufschlag erscheinen, und dass die Werte im Admin unter `/admin/products/[id]` bearbeitbar sind.

## Technische Details

- Daten-Update über `run_sql`: `UPDATE products SET category = ...` für die 5 IDs, danach Seeding in `product_size_variants` und `product_motifs` analog zum bestehenden Holzbox-Seed (inkl. `price_delta_cents = 400` für Motiv 2).
- Keine Schemaänderung nötig; `isConfigurableCategory()` in `src/lib/product-config.ts` deckt `schiebebox` und `holzbox` bereits ab.
- Kein Code-Umbau an PDP oder Admin erforderlich — die Kategorie-Auswahl im Admin existiert bereits, damit dieser Fall künftig selbst korrigiert werden kann.
- Motiv-Vorschaubilder bleiben zunächst leer und können im Admin hochgeladen werden.
