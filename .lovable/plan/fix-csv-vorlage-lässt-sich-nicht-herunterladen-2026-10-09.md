# Fix: CSV-Vorlage lässt sich nicht herunterladen

## Problem
Der Button „CSV-Vorlage herunterladen" in `src/routes/admin/import.tsx` (Funktion `downloadTemplate`, Zeilen 237–244) erzeugt einen Download-Link, hängt ihn aber nie in die Seite ein und gibt die Blob-URL sofort wieder frei. Viele Browser brechen den Download dadurch ab — es passiert sichtbar nichts.

## Änderung (nur `src/routes/admin/import.tsx`)
`downloadTemplate` robust machen:
1. Blob-URL erzeugen (wie bisher, mit BOM für Excel).
2. Den `<a>`-Link kurz in `document.body` einhängen, `click()` ausführen, danach wieder entfernen.
3. `URL.revokeObjectURL` verzögert (per `setTimeout`, ~1 s) aufrufen, damit der Download starten kann.

Keine weiteren Änderungen an Design oder Import-Logik.

## Verifikation
- Typecheck/Build prüfen.
- Per Playwright auf /admin/import den Button klicken und bestätigen, dass ein Download-Event mit Datei `products.csv` ausgelöst wird.
