# Preis-Text im Größe-Selktor anpassen

Im Größe-Auswahl-Block (Komponente `ProductSizeSelector`) soll der Preis unter jeder Größen-Angabe kleiner und rot dargestellt werden — gleiche Schriftgröße wie der darüberstehende Maß-Text (`text-[11px]`) und in der Akzentfarbe für reduzierte Preise (`text-destructive`).

## Änderung

- `src/components/product/size-selector.tsx`
  - Preis-Span von `text-sm text-walnut` auf `text-[11px] text-destructive` ändern.
  - Optional `font-medium` beibehalten, damit der Betrag trotz kleinerer Größe lesbar bleibt.
  - Keine Änderung an der Logik (Rabattberechnung, Auswahl, ARIA).

## Nicht im Scope

- Keine Datenbank-Änderungen.
- Keine Änderungen an der Hauptpreis-Anzeige über dem Warenkorb-Button.
- Keine Änderungen an Rahmen- oder Holzplatte-Dropdowns (dort wird der Preis bereits außerhalb des Dropdowns gezeigt).
