## Warum fehlen die Dropdowns?

Die Größen-/Varianten-Auswahl wird auf der Produktseite nur gerendert, wenn das Produkt in der Kategorie `bilderrahmen` liegt. Produkte, die inhaltlich Rahmen sind, aber in der Datenbank auf `other` (oder einer anderen Kategorie) stehen, bekommen deshalb keine Dropdowns.

Aktueller Stand der aktiven Produkte:

```text
bilderrahmen  77   (60 mit "Rahmen" im Text)
other         23   (18 mit "Rahmen" im Text)
sculpture      7   (6 mit "Rahmen" im Text)
holzplatte     9
schiebebox     7
holzschild     6
holzbox        5
```

## Was gemacht wird

1. **Datenbank aufräumen (Migration)**
   Alle aktiven Produkte, deren Titel/Beschreibung „Bilderrahmen" oder „Echtholzrahmen" enthält und die **nicht** als Box/Schild/Schiebebox beschrieben sind, werden auf die Kategorie `bilderrahmen` gesetzt. Betroffen sind die Oster-, Firmung-, Jugendweihe- und Taufe-Motive sowie die entsprechenden Einträge aus `sculpture`. Reine Holzboxen (z. B. „Holzbox mit Name & Datum") bleiben unverändert.

2. **Kategorie im Admin editierbar machen**
   Auf `/admin/products/[id]` kommt ein Auswahlfeld „Kategorie" (bilderrahmen, holzbox, holzschild, schiebebox, holzplatte, sculpture, other) dazu, damit künftige Fehleinordnungen ohne Migration korrigierbar sind. Das ist der dauerhafte Kontrollpunkt: Kategorie = `bilderrahmen` ⇒ Rahmen-Dropdowns erscheinen.

3. **Sichtbarer Hinweis im Admin**
   Neben dem Feld ein kurzer Hilfetext: „Nur Produkte der Kategorie *bilderrahmen* zeigen im Shop die Größen- und Rahmenauswahl."

## Technische Details

- Migration: gezieltes `UPDATE public.products SET category = 'bilderrahmen'` mit Textfilter, ohne Schemaänderung.
- `src/lib/admin.functions.ts`: `category` in das Update-Schema der Produktbearbeitung aufnehmen (validiert gegen die erlaubte Liste).
- `src/routes/admin/products/$id.tsx`: Select-Feld ergänzen.
- `src/routes/product.$id.tsx` bleibt unverändert – die Bedingung `category === "bilderrahmen"` ist die gewollte Logik.
