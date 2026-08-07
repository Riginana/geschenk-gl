# Größenauswahl mit Rabatt für Holzplatte-Produkte

Aktuell haben die 9 aktiven Produkte der Kategorie `holzplatte` keine Größenauswahl. Sie bekommen dieselbe Mechanik wie die Bilderrahmen: globale Preise plus optionale Preis-Overrides pro Produkt, gepflegt im Admin.

## Preise

| Größe | Normalpreis | Rabatt | Endpreis |
|---|---|---|---|
| 13 × 18 cm | 19,00 € | 30 % | 13,30 € |
| 11 × 15 cm | 15,00 € | 30 % | 10,50 € |

Endpreis = Normalpreis × (1 − Rabatt / 100), kaufmännisch auf 2 Stellen gerundet. Vorausgewählt ist 13 × 18 cm.

## Datenbank

Neue Tabelle `holzplatte_prices`:
- `id` (uuid, PK), `product_id` (uuid, FK auf products, nullable = globaler Standard), `size` (text: `13x18` / `11x15`), `original_price` (numeric(10,2)), `discount_percent` (numeric(5,2), default 0, 0–100), `updated_at` (timestamptz, Trigger)
- Unique-Constraint auf (`product_id`, `size`)
- Zugriff: lesen für alle, ändern nur für angemeldete Admins
- Startdaten (global): 13x18 → 19,00 / 30 %, 11x15 → 15,00 / 30 %

Preisauflösung: erst Eintrag mit passender `product_id`, sonst der globale Eintrag mit `product_id = NULL`.

## Produktseite

Für alle Produkte der Kategorie `holzplatte` erscheint im gleichen Stil wie bei den Rahmen ein Dropdown „Größe“ mit den beiden Optionen. Darunter/neben dem Preis:
- durchgestrichener Normalpreis (z. B. 19,00 €)
- hervorgehobener Endpreis (13,30 €)
- Badge „−30 %“ (nur wenn Rabatt > 0)

Alles aktualisiert sich sofort beim Wechsel der Größe, deutsches Zahlenformat mit Komma.

In den Warenkorb wandern `size`, `original_price`, `discount_percent`, `final_price` als Snapshot; der Server berechnet den Preis beim Checkout wie gehabt neu aus der Datenbank, damit keine manipulierten Preise durchgehen.

## Admin

- `/admin/frame-prices` wird zu einer Preis-Seite mit zwei Blöcken: bestehende „Rahmenpreise“ plus neuer Block „Holzplatte-Preise“ mit den globalen Werten (Normalpreis, Rabatt %), Inline-Bearbeitung, automatisch berechnetem Endpreis und Anzeige der letzten Änderung.
- `/admin/products/[id]`: für Holzplatte-Produkte ein Block „Preis-Override“ mit denselben Feldern je Größe. Leer = globaler Preis gilt; ein Zurücksetzen-Knopf entfernt den Override.
- Änderungen wirken sofort ohne Deploy.

## Mobil

Dropdown, Preisanzeige und beide Admin-Tabellen werden mobil geprüft: Tabellen scrollen horizontal bzw. stapeln als Karten, Eingabefelder bleiben tippbar.

## Technische Details

- Migration mit Tabelle, GRANTs, RLS-Policies (`SELECT` public, `ALL` via `has_role(auth.uid(),'admin')`), `updated_at`-Trigger und den zwei globalen Seed-Zeilen.
- Neu: `src/lib/holzplatte-pricing.ts` (Größen, Labels, `resolveHolzplattePrice`) und `src/lib/holzplatte-prices.functions.ts` (`listHolzplattePrices`, `adminUpsertHolzplattePrices`, `adminDeleteHolzplattePriceOverride`) — analog zu `frame-prices.functions.ts`.
- `src/routes/product.$id.tsx`: `isHolzplatteProduct`-Zweig mit Größen-Dropdown, Preisberechnung und Personalisierungs-Feldern `holzplatteSize` u. a.
- `src/lib/order-pricing.server.ts`: neuer Zweig, der bei `holzplatteSize` den Preis aus `holzplatte_prices` auflöst (Override vor global) — Produkt-`discount_percent` wird dabei nicht zusätzlich angewendet, der Rabatt steckt schon in der Tabelle.
- Warenkorb-/Bestellanzeige (`cart-item-config.tsx`, `/warenkorb`, `/kasse`, Admin-Bestellungen) zeigt die gewählte Größe.
