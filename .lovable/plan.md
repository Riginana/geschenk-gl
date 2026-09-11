# Rabatt bei den Rahmenpreisen

Neben jedem Preis in "Rahmenpreise" kommt ein eigenes Rabatt-Feld (%), plus ein Feld, mit dem sich alle Rabatte der Tabelle auf einmal setzen lassen.

## Was sich in der Admin ändert

- Jede Zelle zeigt künftig zwei Eingaben: **Preis (€)** und **Rabatt (%)**, darunter klein der resultierende Endpreis.
- Über der Tabelle: "Rabatt für alle Felder setzen" — Wert eintragen, Knopf drücken, alle Rabatt-Felder der aktuellen Unterkategorie (bzw. des Produkts) werden gefüllt. Gespeichert wird wie bisher mit "Speichern".
- Produktspezifische Ausnahmen speichern Preis und Rabatt gemeinsam; die Kaskade bleibt: Produkt-Ausnahme → Unterkategorie → allgemein.

## Was sich auf der Website ändert

- Bei Bilderrahmen gilt ab sofort **nur noch der Rabatt aus der Rahmenpreis-Tabelle**. Der bisherige pauschale 30 %-Produktrabatt wird für diese Kategorie nicht mehr angewendet.
- Beispiel: Papier / A5 / ohne Bilderrahmen mit 55 € und 0 % zeigt auf der Website 55 €. Mit 30 % zeigt es 38,50 € durchgestrichen ab 55 €.
- Gilt überall gleich: Katalog, Produktseite, Warenkorb und Bestellsumme.

## Technische Details

1. Migration: `frame_prices.discount_percent integer NOT NULL DEFAULT 0` (Check 0–100). Bestehende Zeilen starten bei 0 — damit fällt der alte 30 %-Aufschlagseffekt weg; falls die aktuellen Website-Preise erhalten bleiben sollen, wird per Datenupdate 30 auf die vorhandenen Zeilen gesetzt.
2. `src/lib/frame-pricing.ts`: `FramePriceRow` um `discount_percent`; `resolveFramePriceCents` liefert zusätzlich `resolveFramePrice()` mit `{ listCents, finalCents, discountPercent }`; Kaskade unverändert (Zeile gewinnt komplett, Preis und Rabatt zusammen).
3. `src/lib/frame-prices.functions.ts`: `listFramePrices` selektiert das neue Feld; `adminUpsertFramePrices`-Schema um `discountPercent` erweitert (Insert und Update).
4. `src/lib/catalog-pricing.ts`: im Bilderrahmen-Zweig `withDiscount` nicht mehr verwenden, sondern `finalCents`/`discountPercent` aus der Preistabelle; Minimum über `finalCents` bestimmen.
5. `src/routes/product.$id.tsx` und `src/lib/order-pricing.server.ts`: Rahmenpreis über die neue Resolver-Funktion, Endpreis aus der Tabelle statt Produktrabatt.
6. `src/routes/admin/frame-prices.tsx`: Draft-State hält `{ price, discount }` je Zelle, Bulk-Setzen-Feld, Endpreis-Anzeige, Validierung 0–100.

Keine Änderung an Holzplatte-, Holzbox- oder Schiebebox-Preisen.
