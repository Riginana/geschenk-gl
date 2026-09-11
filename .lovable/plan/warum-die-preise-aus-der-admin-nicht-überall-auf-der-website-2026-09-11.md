# Warum die Preise aus der Admin nicht überall auf der Website ankommen

## Was ich in den Daten gesehen habe

- In der Preistabelle gibt es aktuell nur für **Papier** eigene Unterkategorie-Preise (21 Felder). Für **Holz** und **HDF** wurde noch nichts gespeichert — dort gelten weiterhin die alten allgemeinen Preise. Das ist so gewollt, sieht aber wie "nicht aktualisiert" aus.
- Von den Papier-Preisen weicht bisher genau ein Feld vom allgemeinen Preis ab (A5, ohne Bilderrahmen: 55,00 € statt 17,00 €). Alle anderen Felder sind identisch — deshalb ändert sich auf der Website sichtbar fast nichts.
- **3 Bilderrahmen-Produkte haben eigene Ausnahmepreise** (insgesamt 62 Einträge). Bei diesen Produkten hat die Massenänderung bewusst keine Wirkung, weil die Produkt-Ausnahme Vorrang hat. Genau diese Produkte wirken "hängen geblieben".
- Zuordnung heute: 85 Produkte Papier, 11 HDF, 6 Holz.
- Die Umstellung auf Unterkategorien ist bisher nur in der Vorschau aktiv. Die veröffentlichte Website läuft noch mit dem alten Stand und ignoriert die Unterkategorie-Preise komplett.

## Was ich umsetze

1. **Veröffentlichen**, damit die Unterkategorie-Logik auch auf der Live-Seite gilt. Danach prüfe ich einen Papier-Artikel live gegen den erwarteten Preis.
2. **Produkt-Ausnahmen sichtbar machen**: In "Rahmenpreise" ein Hinweisfeld mit der Liste der Produkte, die eigene Ausnahmepreise haben, plus Schaltfläche "Alle Ausnahmen dieses Produkts entfernen". Damit greift die Massenänderung wieder.
3. **Reiter-Status anzeigen**: Pro Reiter (Papier / Holz / HDF) anzeigen, ob eigene Preise hinterlegt sind oder noch die allgemeinen Preise gelten, inklusive Anzahl der zugeordneten Produkte.
4. **Preise sofort sichtbar**: Nach dem Speichern werden Katalog- und Produktseiten-Preise unmittelbar neu geladen, statt bis zu einer Minute die alten Werte zu zeigen.

## Technische Details

- `src/routes/admin/frame-prices.tsx`: Badge je Material-Reiter (eigene Preise vs. Fallback), Override-Panel mit Produktliste aus `frame_prices` (`product_id is not null`), Aktion "Overrides entfernen".
- `src/lib/frame-prices.functions.ts`: neue Admin-Funktion `adminDeleteAllFramePriceOverrides({ productId })` (löscht alle Zeilen mit diesem `product_id`), analog zur bestehenden Einzel-Löschung.
- Cache: `framePricesQueryOptions.staleTime` in `src/lib/catalog-pricing.query.ts` auf 0 bzw. gezielte `invalidateQueries(["frame-prices"])` nach dem Speichern.
- Keine Schemaänderung nötig; Preis-Kaskade (Produkt-Ausnahme → Unterkategorie → allgemein) bleibt unverändert.
