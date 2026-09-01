# Plan: Beschreibung ohne abgeschnittenen Text einklappen

## Problem
Auf der Produktseite (`/product/[id]`) wird die lange Beschreibung aktuell per fixer Pixelhöhe (`max-height: 144px`) plus Fade-Verlauf abgeschnitten. Dadurch wird mitten in einer Textzeile abgeschnitten und der abgeblendete Text bleibt halb sichtbar — wie im Screenshot zu sehen.

## Lösung
Die Komponente `src/components/expandable-text.tsx` wird auf zeilenbasiertes Kürzen umgestellt:

1. **Statt Pixelhöhe: `line-clamp`** — der Text wird sauber nach 3 vollständigen Zeilen abgeschnitten (CSS `line-clamp: 3`), ohne Fade-Verlauf und ohne halbtransparente Zeilen.
2. **Fade-Gradient entfernen** — das Überblend-Element (`bg-gradient-to-t from-card`) wird komplett gelöscht.
3. **Overflow-Erkennung anpassen** — „Mehr anzeigen" erscheint weiterhin nur, wenn der Text tatsächlich länger als 3 Zeilen ist (Vergleich von `scrollHeight` mit der Höhe bei aktivem Clamp).
4. **Toggle bleibt** — „Mehr anzeigen / Weniger anzeigen" klappt den vollständigen Text auf bzw. wieder zu, mit sanfter Höhen-Animation.

## Betroffene Dateien
- `src/components/expandable-text.tsx` (Hauptänderung)
- Keine Änderungen an `src/routes/product.$id.tsx` nötig — die Komponente wird dort bereits verwendet.

## Verifikation
- Typecheck (`bunx tsgo --noEmit`)
- Browser-Test auf einer Produktseite mit langer Beschreibung: Text endet nach einer vollständigen Zeile, kein halb ausgeblendeter Text, Auf-/Zuklappen funktioniert.
