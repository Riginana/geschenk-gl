# Motiv-Bilder für Schiebebox-Motive

Die vier hochgeladenen Bilder werden als Vorschaubilder für die Motive 1–4 hinterlegt. Auf der Produktseite erscheinen sie dann oben in jeder Motiv-Karte, direkt über Titel und Beschreibung.

## Zuordnung

- Motiv 1 — Zwei Herzen → `1_motiv_-_2_herzen`
- Motiv 2 — Wunschtext → `2_motiv_-_wunschtext`
- Motiv 3 — Hand in Hand → `3_motiv_-_hand_in_hand`
- Motiv 4 — Eure Liebe → `4_motiv_-_eure_liebe`

## Umsetzung

1. Die vier Bilder in den bestehenden öffentlichen Storage-Bucket `product-images` hochladen (Ordner `motifs/`), als WebP konvertiert für schnelle Ladezeiten.
2. In `product_motifs` das Feld `preview_image_url` für alle Schiebebox-Produkte anhand der Motiv-Nummer auf die jeweilige öffentliche URL setzen (gilt für alle Produkte, die diese Motive haben).
3. Keine Code-Änderung nötig: die Motiv-Karten (`src/components/product/motif-selector.tsx`) und der Admin-Editor zeigen das Bild bereits an, sobald eine URL gesetzt ist — inklusive Zoom-Ansicht.
4. Prüfung auf der Produktseite, dass die Bilder in allen vier Karten oberhalb des Texts erscheinen.

Über den Admin-Bereich („Schiebebox: Größen & Motive") bleiben die Bilder pro Produkt später einzeln austauschbar.
