# CSV-Vorlage zuverlässig herunterladen

## Ursache
Der Download-Code ist bereits korrigiert und funktioniert im normalen Browser. Im Lovable-Vorschaufenster ist die Seite aber in einen eingebetteten Rahmen eingebettet, der Downloads aus dem Browser-Speicher (Blob) blockiert. Deshalb passiert beim Klick nichts.

## Lösung
1. **Echte Datei statt Blob:** Die Vorlage wird als feste Datei `products-vorlage.csv` auf der Website abgelegt (gleicher Inhalt wie jetzt, mit Umlauten korrekt für Excel).
2. **Button wird zu einem Link**, der diese Datei in einem **neuen Tab** öffnet bzw. herunterlädt. Neue Tabs sind von der Sperre der Vorschau nicht betroffen; auf diginutz.de funktioniert es direkt.
3. **Ausweichlösung direkt auf der Seite:** Unter dem Button ein aufklappbarer Bereich „Vorlage anzeigen" mit dem CSV-Text und einem Button „In Zwischenablage kopieren" — falls ein Browser trotzdem blockiert, kann man den Text in eine leere Datei einfügen.
4. Kurzer Hinweis neben dem Button: „Lädt nicht in der Vorschau? Öffnen Sie /admin/import direkt auf diginutz.de."

Design und Import-Logik bleiben unverändert.

## Technische Details
- Neue Datei `public/products-vorlage.csv` (UTF-8 mit BOM), Inhalt = aktuelle `TEMPLATE`-Konstante.
- In `src/routes/admin/import.tsx`: `downloadTemplate`-Button ersetzen durch `<a href="/products-vorlage.csv" download target="_blank" rel="noopener">`; `<details>` mit `<pre>`-Vorschau und `navigator.clipboard.writeText(TEMPLATE)` + sonner-Toast.
- Verifizierung per Playwright: Datei unter `/products-vorlage.csv` erreichbar, Link löst Download aus.
