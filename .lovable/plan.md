## Ziel

Für Rahmen-Produkte (Kategorie `bilderrahmen`, 77 aktive Artikel) gibt es künftig zwei Auswahlfelder – Größe und Rahmen-Variante – deren Preise zentral über eine neue Admin-Seite gepflegt werden.

## 1. Datenbank

Neue Tabelle `frame_prices`:
- `id`, `product_id` (nullable → NULL = globaler Standardpreis), `size` (`A5`/`A4`/`A3`), `variant` (7 Werte), `price_cents` (Integer, statt numeric – konsistent zum restlichen Shop, der überall in Cent rechnet), `updated_at`
- Eindeutigkeit über (`product_id`, `size`, `variant`) inkl. korrekter Behandlung von NULL (Unique-Index auf COALESCE)
- Zugriff: Lesen für alle, Ändern nur für eingeloggte Admins (`has_role(auth.uid(),'admin')`), plus GRANTs
- Startbefüllung mit den 21 genannten globalen Preisen (product_id = NULL)

Preislogik: gilt ein Produkt-Override, hat er Vorrang; sonst greift der globale Preis.

## 2. Produktseite `/product/[id]`

Nur bei Kategorie `bilderrahmen`:
- Dropdown „Größe": A5 (14,8 × 21 cm), A4 (21 × 29,7 cm), A3 (29,7 × 42 cm)
- Dropdown „Rahmen-Variante": ohne Bilderrahmen, Standard Weiß, Echtholz Weiß, Standard Schwarz, Echtholz Schwarz, Standard Dunkelbraun, Echtholz Dunkelbraun
- Optik wie die bestehenden Auswahlelemente (Card, `eyebrow`-Label, Cream-Hintergrund, Walnut-Rahmen)
- Preis aktualisiert sich sofort bei Auswahl; der bestehende Rabatt (`discount_percent`) wird angewendet, mit Streichpreis und Prozent-Badge wie bisher
- Warenkorb: Größe und Variante werden in der Personalisierung mitgeführt, fließen in die Artikel-ID ein und erscheinen in Warenkorb/Kasse/Bestellung
- Alle anderen Produktkategorien behalten unverändert die bisherigen Format-/Material-Buttons

## 3. Admin `/admin/frame-prices`

- Neuer Menüpunkt im Admin-Bereich
- Raster 3 Größen × 7 Varianten mit Euro-Eingabefeldern für die globalen Standardpreise, „Speichern" schreibt alle geänderten Zellen
- Produkt-Override: Auswahl eines Rahmen-Produkts, gleiches Raster; leere Zelle = globaler Preis, ausgefüllte Zelle = Override; Override je Zelle löschbar
- Speichern läuft über geschützte Server-Funktionen mit Admin-Rollenprüfung

## Technische Details

- Migration über das Migrationstool (Tabelle + GRANTs + RLS + Policies + Seed-INSERTs in einem Schritt)
- Lesen: neue öffentliche Server-Funktion `frame-prices.functions.ts` (publishable Client), per TanStack Query gecacht und im Loader von `/product/$id` vorgeladen
- Schreiben: Server-Funktionen mit `requireSupabaseAuth` + `has_role`-Prüfung, analog zu `admin.functions.ts`
- Anzeige weiterhin über `calculateDiscountedPrice` aus `src/lib/pricing.ts`
- Betroffene Dateien: neue Migration, `src/lib/frame-prices.functions.ts`, `src/routes/product.$id.tsx`, `src/routes/admin/frame-prices.tsx`, Admin-Navigation, i18n-Texte
