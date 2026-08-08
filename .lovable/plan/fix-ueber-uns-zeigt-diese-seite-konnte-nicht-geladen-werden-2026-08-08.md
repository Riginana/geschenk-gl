# Fix: /ueber-uns zeigt "Diese Seite konnte nicht geladen werden"

## Was ich geprüft habe

- Die Route `src/routes/ueber-uns.tsx` existiert und ist korrekt registriert.
- Im Entwicklungsserver lädt `/ueber-uns` fehlerfrei (HTTP 200, vollständiger Inhalt: Überschrift, Werkstatt-Bild, drei Info-Karten) — auch in einem Testbrowser ohne Konsolenfehler.
- Die veröffentlichte Seite `geschenk-gl.lovable.app/ueber-uns` liefert ebenfalls vollständigen Inhalt.
- Die Fehlermeldung, die du siehst, ist der globale Fehler-Fallback aus `src/routes/__root.tsx`. Sie tritt nur in der Lovable-Vorschau auf.

Damit ist die Ursache noch nicht bewiesen: Der Fehler entsteht erst im Produktions-/Vorschau-Build, nicht im Entwicklungsmodus. Der erste Schritt ist deshalb, den Fehler reproduzierbar sichtbar zu machen — keine Vermutung ins Blaue.

## Vorgehen

1. **Fehler sichtbar machen**: Produktions-Build lokal ausführen und `/ueber-uns` im gebauten Zustand aufrufen, um die echte Fehlermeldung samt Stacktrace zu erhalten (Build- und Prerender-Ausgabe auswerten).
2. **Ursache beheben**: Je nach Befund die konkrete Stelle korrigieren. Wahrscheinlichste Kandidaten, die im Build anders laufen als im Dev-Modus:
   - das Werkstatt-Bild `src/assets/atelier.jpg` (als einziges verwendetes Asset ohne ausgelagerte Asset-Referenz),
   - die Animations-Komponente `Reveal` / `framer-motion` beim Server-Rendern,
   - der Sprach-Kontext (`useT`) während des Prerenderings.
3. **Route absichern**: `/ueber-uns` bekommt eine eigene `errorComponent`, damit ein Einzelfehler künftig nicht mehr die ganze Seite als "Etwas ist schiefgelaufen" ersetzt, sondern nur den betroffenen Abschnitt.
4. **Verifizieren**: Nach dem Fix erneut Produktions-Build + Aufruf der Seite im Testbrowser, Konsolen- und Server-Logs prüfen.

## Nicht Teil dieser Arbeit

- Keine inhaltlichen oder gestalterischen Änderungen an der Seite "Über uns".
- Keine Änderungen an Datenbank, Preisen oder Checkout.
