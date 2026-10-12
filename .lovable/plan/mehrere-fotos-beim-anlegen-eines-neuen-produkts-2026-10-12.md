# Mehrere Fotos beim Anlegen eines neuen Produkts

## Was sich ändert
Im Fenster „+ Neues Produkt“ (Admin → Produkte) gibt es ein neues Feld „Fotos“:
- Mehrere Bilder auf einmal auswählen oder hineinziehen (JPG, PNG, WebP, max. 20 MB je Bild).
- Vorschau als quadratische Kacheln; einzelne Fotos entfernen, Reihenfolge mit Pfeilen ändern.
- Das erste Foto wird automatisch Hauptbild (mit Stern markiert, per Klick änderbar).
- Beim Klick auf „Erstellen“: Produkt wird angelegt, dann werden die Fotos nacheinander hochgeladen, mit Fortschritt („3 / 7 Fotos“).
- Schlägt ein Foto fehl, bleibt das Produkt bestehen; die Meldung nennt die fehlgeschlagenen Dateien, sie können auf der Produktseite nachgeladen werden.
- Danach öffnet sich wie bisher die Produkt-Bearbeitungsseite. Das Produkt bleibt Entwurf (nicht automatisch veröffentlicht).

Shop, Design und bestehende Produktseite im Admin bleiben unverändert. Keine Datenbankänderung.

## Technische Details
- `src/routes/admin/products/index.tsx`: State `files: {file, previewUrl}[]`, `heroIndex`; Dropzone + `<input type=file multiple accept="image/jpeg,image/png,image/webp">`; Client-Validierung Typ/Größe.
- In `submitNew` nach `adminCreateProduct`: pro Datei `adminCreateUploadUrl` → `uploadToSignedUrl` → `adminAddImage` (role hero für heroIndex, sonst gallery, sort_order = Index), gleiche Logik wie in `admin/products/$id.tsx`; danach `hero_image` per `adminUpdateProduct` setzen.
- Object-URLs beim Schließen freigeben.
