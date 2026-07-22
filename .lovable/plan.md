# Kataloger­satz aus `website-media-final`

## Ausgangs­lage
- Aktueller Katalog: 90+ Etsy-Produkte, statisch aus `src/data/products.json` via `listProducts` (kein DB-Read).
- Archiv liefert **142 Design-Gruppen** über **18 Anlässe**, insgesamt **784 WebP**-Dateien (~47 MB), plus `images.csv` (title/alt/material) und `media.json` (Rollen hero/gallery/product je Anlass).
- Bucket `product-images` (public) existiert bereits.

## Umfang je Anlass (Designs)
Hochzeit 39, Geburtstag 27, Weihnachten 19, Baby 8, Reise 7, Schulabschluss 7, Wunscherfüller 7, Ostern 4, Rente 4, Firmung 3, Taufe 3, Konfirmation 3, Mutterschutz 3, Kommunion 2, Jugendweihe 2, Neues-Zuhause 2, Führerschein 1, Sonstiges 1.

## Schritte

### 1. Medien hochladen (Storage)
- Alle `Website/<Anlass>/{Hero,Gallery,Product,Thumbnail}/*.webp` in Bucket `product-images` unter Präfix `catalog/<anlass-slug>/<role>/<filename>` hochladen (service_role).
- Log `upload_map.json`: `{ originalPath: publicUrl }`.
- Fehler → `failed_uploads.json`, weiter mit nächster Datei.

### 2. Produkt­daten generieren (`src/data/products.json` neu schreiben)
Ein Produkt = eine Design-Gruppe (Basisname ohne `-NN.webp`), zusammengeführt aus `media.json`.

Felder je Produkt:
- `id`: `design-<anlass-slug>-<base>` (deterministisch, ersetzt `etsy-…`)
- `slug`: `<base>` (aus Dateiname; bereits SEO)
- `name_de`, `name_en`: `title` aus CSV (identisch; en=de vorerst)
- `description_de`/`description_en`: leer / `alt`-Text als Fallback
- `base_price_cents`: `1600` (Platzhalter „ab 16,00 €")
- `occasion`: Mapping (siehe unten)
- `material`: aus CSV (`Bilderrahmen | Holzbox | Holzschild | Holzplatte | Schiebebox | Geschenk`) → als Tag/Attribut, plus interner `material`-Key `holz` für alle.
- `formats`: `["A4"]` (Standard)
- `images`: alle `Product/…webp` (Fallback: `Gallery/…webp`) der Design-Gruppe, geordnet nach `-NN`
- `hoverImage`: 2. Bild derselben Gruppe
- `badge`: `"draft"` (neuer Badge-Wert, um manuelle Nach­bearbeitung sichtbar zu markieren)
- `tags`: `[material, anlass, "draft"]`
- `inStock`: `true`

### 3. Anlass-Filter erweitern
`src/routes/shop.index.tsx` – `OCCASIONS`-Array um neue Keys ergänzen:
`firmung, kommunion, jugendweihe, ostern, reise, mutterschutz, fuehrerschein, wunscherfueller, sonstiges` (die meisten sind bereits enthalten; fehlen tatsächlich nur `reise`, `wunscherfueller`).
i18n-Labels ergänzen in `src/i18n/de.ts` + `en.ts` unter `occasions.*`.

Kategorien-Mapping (Archiv → intern):
| Archiv | intern |
|---|---|
| Baby | `geburt` |
| Schulabschluss | `abitur` |
| Rente | `ruhestand` |
| Neues-Zuhause | `einzug` |
| Fuehrerschein | `fuehrerschein` |
| Wunscherfueller-Geschenke | `wunscherfueller` *(neu)* |
| Reise | `reise` *(neu)* |
| Hochzeit / Geburtstag / Taufe / Konfirmation / Firmung / Kommunion / Jugendweihe / Ostern / Weihnachten / Mutterschutz / Sonstiges | unverändert |

### 4. Hero-Banner je Anlass
- `src/lib/product-images.ts`: `imageFor(occasion)` mappt jetzt auf das erste `Hero/`-Bild des jeweiligen Anlasses aus `upload_map.json`.
- Startseite / Anlass-Kacheln bekommen so automatisch die neuen Fotos.
- Auf `/shop?occasion=…` (in `shop.index.tsx`) einen Hero-Banner oberhalb der Grid einfügen (nur wenn `search.occasion` gesetzt): `<img src={heroFor(occasion)}>` mit Titel des Anlasses.

### 5. DB-Aufräumung
`products`-Tabelle existiert zwar (aus früherer Migration), aber `listProducts` liest ausschließlich JSON. Trotzdem: Migration, die alle Zeilen aus `public.products` löscht, damit spätere Wechsel zu DB-Backend nicht auf Altbestand stoßen.

### 6. Design-System
Keine Änderungen an Farben/Schriften/Card-Layout. `ProductCard`, `shop.index.tsx`, `product.$id.tsx` bleiben strukturell gleich; nur der Draft-Badge (grauer Chip „Entwurf") wird ergänzt.

### 7. Verifikation
Nach Import Ausgabe pro Anlass: `slug → #Bilder`. Playwright: `/shop`, `/shop?occasion=hochzeit`, ein Produkt mit ≥5 Bildern – bestätigen, dass alle `product-images/catalog/...` mit HTTP 200 laden.

## Technische Notizen
- Uploads gehen über `supabase--storage_upload` in Batches (~30 Dateien / Aufruf), service_role → RLS-konform (bestehende Policy erlaubt nur service_role write).
- `products.json` wird komplett neu geschrieben (kein Merge mit Etsy-Daten).
- Alle Etsy-`etsy-…`-Produkte verschwinden mit dem Overwrite; die Route `/shop/$slug` funktioniert weiter, weil sie nach neuem `slug`/`id` matcht.
- Keine Preisspalte / kein Beschreibungstext – Sie tragen später manuell nach. Draft-Badge bleibt sichtbar bis Sie ihn im JSON auf `null` setzen.
