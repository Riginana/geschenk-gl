# WhatsApp-Duplizierung im Footer bereinigen

## Ausgangslage
- `src/components/footer.tsx` enthält im Social-Media-Block ein WhatsApp-Icon-Link (Zeile 101).
- `src/components/whatsapp-float.tsx` rendert zusätzlich einen fixen WhatsApp-Button unten rechts auf jeder Seite.
- Beide Kontaktpunkte sind gleichzeitig sichtbar, wenn man bis zum Footer scrollt — das wirkt wie eine doppelte WhatsApp-Verlinkung.

## Ziel
Das als doppelt empfundene WhatsApp-Element entfernen, ohne die WhatsApp-Erreichbarkeit der Seite zu verlieren.

## Umsetzung
1. In `src/components/footer.tsx` den WhatsApp-Icon-Link aus dem Social-Media-Block entfernen.
2. Instagram-Link im Footer belassen.
3. `WhatsAppFloat` unverändert lassen, damit der globale WhatsApp-Button weiterhin verfügbar ist.

## Ergebnis
- Footer zeigt nur noch Instagram als Social-Link.
- WhatsApp bleibt über den schwebenden Button erreichbar.
- Keine visuelle Duplizierung mehr im Footer-Bereich.
