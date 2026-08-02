## Ausgangslage (geprüft)

Im Admin gibt es aktuell nur Bearbeiten von bestehenden Produkten: `src/lib/admin.functions.ts` enthält `adminListProducts`, `adminGetProduct`, `adminUpdateProduct`, `adminBulkSetActive`, Bild-Upload und Varianten — aber **keine** Funktion zum Anlegen oder Löschen eines Produkts. Deshalb kann der Kunde heute kein neues Produkt hinzufügen.

Auf der Website erscheinen Produkte automatisch, sobald `is_active = true` ist (Shop liest aktive Produkte aus der Datenbank) — es braucht also keinen extra „Veröffentlichen"-Mechanismus, nur das Aktiv-Flag.

## Was gebaut wird

**1. Backend-Funktionen (`src/lib/admin.functions.ts`)**
- `adminCreateProduct`: legt ein Produkt an (Admin-Rolle wird wie bisher geprüft). Eingaben: Name DE/EN, Anlass, Kategorie, Grundpreis, Rabatt. Slug wird aus dem Namen automatisch erzeugt und bei Kollision mit Suffix eindeutig gemacht. Neues Produkt startet als **Entwurf** (`is_active = false`), damit nichts Halbfertiges im Shop steht.
- `adminDeleteProduct`: löscht Produkt inkl. zugehöriger Bilder/Varianten (mit Bestätigungsdialog im UI).

**2. Produktliste `/admin/products`**
- Button „+ Neues Produkt" oben rechts öffnet ein kleines Formular (Dialog): Name DE, Name EN, Anlass, Kategorie, Preis in €.
- Nach dem Speichern springt die Seite direkt in den Editor `/admin/products/[id]`.
- Pro Zeile ein Löschen-Button mit Rückfrage.

**3. Editor `/admin/products/[id]`** (bereits vorhanden)
- Dort werden dann wie gewohnt Fotos/Video hochgeladen, Beschreibung, Varianten, Bilderrahmen-Preise und SEO gepflegt.
- Der bestehende Schalter „aktiv" schaltet das Produkt live in den Shop.

**4. Kurzanleitung**
Auf der Produktliste ein dezenter Hinweistext: Produkt anlegen → Bilder hochladen → Beschreibung/Preis → Schalter „aktiv" → Produkt ist auf der Website sichtbar.

## Technische Details
- Keine Datenbank-Migration nötig: alle Pflichtfelder der Tabelle `products` haben Defaults oder werden im Formular gesetzt (`slug`, `name_de/en`, `description_de/en`, `base_price_cents`, `occasion`).
- Alle Schreibzugriffe laufen weiterhin über Server-Funktionen mit `requireSupabaseAuth` + `has_role(admin)`; keine neuen öffentlichen Endpunkte, RLS bleibt unverändert.
- Löschen entfernt zuerst `product_images`/`product_variants`, dann die Produktzeile (Storage-Dateien bleiben erhalten).

## Danach
Änderungen sind sofort in der Vorschau aktiv; für geschenk-gl.lovable.app einmal „Update" im Publish-Dialog.
