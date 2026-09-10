# Bild auf /ueber-uns ersetzen

## Ziel
Das Werkstatt-Bild auf der Seite **/ueber-uns** wird durch das neu hochgeladene Foto ersetzt. Die Startseite behält ihr bisheriges Bild unverändert bei.

## Hintergrund
- Aktuell nutzt `/ueber-uns` das Asset `src/assets/atelier.jpg`.
- Dieselbe Datei wird auch im Atelier-Block der Startseite (`src/routes/index.tsx`) verwendet.
- Da die Ersetzung **nur** auf `/ueber-uns` erfolgen soll, wird ein **neues, separates Asset** benötigt, damit die Startseite unangetastet bleibt.

## Schritte

1. **Neues Asset anlegen**
   - Hochgeladenes Bild `/mnt/user-uploads/WhatsApp_Image_2026-09-09_at_22.35.10.jpeg` via `lovable-assets` ins CDN laden.
   - Pointer-Datei schreiben nach `src/assets/atelier-ueber-uns.jpg.asset.json`.

2. **Route anpassen**
   - In `src/routes/ueber-uns.tsx`:
     - Import von `@/assets/atelier.jpg` ersetzen durch Import des neuen Pointer-JSONs.
     - `<img src={atelier}>` auf `src={neuesAsset.url}` setzen.
     - Alt-Text bleibt „Unsere Werkstatt".

3. **Startseite nicht anpassen**
   - `src/routes/index.tsx` behält `@/assets/atelier.jpg` unverändert.

4. **Verifizieren**
   - `bunx tsgo --noEmit -p tsconfig.json` zur Typprüfung.
   - Build-Logs (`/tmp/observability/build-errors.log`) prüfen.
   - Browser-Check auf `/ueber-uns`: neues Bild sichtbar; Startseite weiterhin altes Bild.

## Technische Details
- Bildquelle: `user-uploads://WhatsApp_Image_2026-09-09_at_22.35.10.jpeg` (1254×1254, Workshop-/Produktmotiv mit Lasergravierer und gerahmten Holzgeschenken).
- Auslagerung über Lovable-Assets-CDN (`/__l5e/assets-v1/...`), keine Binärdatei im Repo belassen.
- `og:image` auf der Route bleibt ungesetzt (kein absolutes Bild).
