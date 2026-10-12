# Shop-Filter: neue Material-Auswahl, Format-Block raus

## Was sich auf `/shop` ändert

- Im Block **Material** stehen künftig genau fünf Knöpfe: **Papier, Holzplatte, Eichedekorplatte, Holz-Schiebebox, Holzbuch** (statt heute Holz / Papier / Kraftpapier).
- Der Block **Format** (A5 / A4 / A3) verschwindet komplett.
- Der Knopf **Alle** zum Zurücksetzen bleibt.
- Keine Datenbank-Änderung, keine Preis-Änderung, kein Migration.

## Was jeder Knopf zeigt

Die fünf Namen wurden gegen die echten Katalogdaten geprüft (152 aktive Produkte). Zwei davon — „Eichedekorplatte" und „Holzbuch" — gibt es heute nur in Produkt*titeln*, nicht als eigene Produktart. Sie sind deshalb der nächsten bestehenden Gruppe zugeordnet:

| Knopf | Regel | aktive Produkte |
|---|---|---|
| Papier | Bilderrahmen mit Unterkategorie Papier | 92 |
| Holzplatte | Produktart Holzplatte | 9 |
| Eichedekorplatte | Bilderrahmen mit Unterkategorie HDF (dort liegen alle 4 Eichedekorplatten-Artikel) | 13 |
| Holz-Schiebebox | Produktart Schiebebox | 8 |
| Holzbuch | Produktart Holzbox (hier liegt u. a. „Holzbuch Ja") | 16 |

Sagen Sie kurz Bescheid, wenn hinter „Eichedekorplatte" oder „Holzbuch" andere oder zusätzliche Artikel stecken sollen — das ist eine Zeile pro Knopf.

14 Produkte (7 Bilderrahmen aus Holz, 6 Holzschild, 1 Skulptur) liegen hinter keinem der fünf Knöpfe. Sie bleiben sichtbar, solange „Alle" aktiv ist, und sind über den Anlass-Block auffindbar. Wenn Sie möchten, ergänze ich dafür zusätzliche Knöpfe.

## Format-Block

- Rauf und runter aus der Filterleiste (Desktop und mobil; der „Filter +/−"-Knopf bleibt).
- `format` fliegt aus der Liste der erlaubten URL-Parameter. Alte Links mit `?format=A4` öffnen weiter den Shop, der Parameter wird nur ignoriert.
- Auf den Produktseiten bleibt die Format-Auswahl A5/A4/A3 unverändert — gemeint ist nur der Shop-Filter.

## Technische Details

- `src/routes/shop.index.tsx`
  - Neue Konstante `MATERIALS`: fünf Einträge mit URL-Wert, i18n-Key und Test-Funktion pro Knopf.
  - `searchSchema.material`: Enum auf die fünf Werte (`papier`, `holzplatte`, `eichedekorplatte`, `holz-schiebebox`, `holzbuch`); `format` aus Schema, Filterlogik und JSX entfernen.
  - Material-FilterGroup rendert die Knöpfe über `MATERIALS` statt drei harter Zeilen.
  - Importe: `isFrameCategory` aus `@/lib/catalog-pricing`, `normalizeFrameMaterial` aus `@/lib/frame-pricing`.
- `src/i18n/de.ts` und `src/i18n/en.ts`
  - Neue Keys: `shop.matPapier`, `shop.matHolzplatte`, `shop.matEichedekorplatte`, `shop.matHolzSchiebebox`, `shop.matHolzbuch`.
  - Deutsch wie oben; Englisch: Paper / Wood plate / Oak decor plate / Wood sliding box / Wood book.
  - `shop.filterFormat` wird entfernt (nur dort benutzt). `shop.holz`, `shop.karton`, `shop.kraftpapier`, `shop.papier` bleiben stehen — der Warenkorb bildet daraus dynamisch seine Texte.
- Kein Eingriff in Kategorien, Preise, Admin-Panel, Produktseiten.

## Prüfung nach dem Umbau

- Typcheck (`bunx tsgo --noEmit`) und Build-Log bleiben fehlerfrei.
- Im Browser: jeden der fünf Knöpfe klicken, Trefferzahl über dem Raster ändert sich wie in der Tabelle; „Alle" setzt zurück; Combobox mit Anlass und Suche funktioniert weiter; auf dem Handy lässt sich die Filterleiste öffnen/schließen; kein Format-Block mehr sichtbar.

## Hinweis

Ich schreibe „Eichedekorplatte" (Ihre Notiz lautete „Eicherdeckoplatte") — korrigieren Sie mich, wenn im Shop ein anderes Wort stehen soll.
