# Admin-Panel komplett auf Deutsch

Die Admin-Oberfläche mischt aktuell Russisch und Deutsch. Alle sichtbaren Texte werden auf Deutsch umgestellt — Funktionalität bleibt unverändert.

## Was geändert wird

**Seitenleiste (`src/routes/admin/route.tsx`)**
- Товары → Produkte
- Главная → Startseite
- Настройки → Einstellungen
- Заказы → Bestellungen

**Übersicht (`src/routes/admin/index.tsx`)**
- Karten: Produkte, Startseite, Einstellungen, Bestellungen
- „В разработке." → „In Arbeit."

**Produktliste (`src/routes/admin/products/index.tsx`)**
- Seitentitel, Tabellenkopf (Foto, Name, Anlass, Kategorie, Preis €, Rabatt %, Status)
- Filter (Suche nach Name/Slug…, Alle Anlässe, Alle Kategorien, Alle Status, Nur veröffentlicht, Nur Entwürfe)
- Auswahl-Leiste, Zurücksetzen, Zähler (Gesamt / Angezeigt)
- Meldungen: „Produkt erstellt (Entwurf)", „Produkt gelöscht", Lösch-Bestätigung, Validierungsfehler
- Zustände: „Wird geladen…", „Keine Produkte"
- Seitentitel im Browser-Tab: „Produkte — Admin"

**Produktdetail (`src/routes/admin/products/$id.tsx`)**
- „← Produkte", Speicherstatus (Wird gespeichert… / Gespeichert)
- Abschnitte: Grunddaten, Galerie, Varianten
- Platzhalter „oder URL des neuen Bildes", „Wird geladen…", „Nicht gefunden"
- Browser-Tab: „Produkt — Admin"

## Technisches

Reine Textersetzungen in den vier genannten Dateien; keine Logik-, Datenbank- oder Routing-Änderungen.
