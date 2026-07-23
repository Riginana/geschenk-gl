## Admin-Panel /admin — Plan

Große, zusammenhängende Aufgabe. Vor der Umsetzung ein paar Punkte zur Bestätigung, danach baue ich alles am Stück.

### Was gebaut wird

**Auth**
- Neue Tabelle `user_roles` + Enum `app_role` + Security-Definer `has_role()` (Standard-Pattern, keine Rollen auf `profiles`).
- Route-Gate `src/routes/_authenticated/route.tsx` (managed) + zusätzlicher `_authenticated/_admin` Layout, der `has_role(uid,'admin')` per Server-Fn prüft, sonst Redirect auf `/admin/login`.
- `/admin/login` — öffentliche Route mit Supabase E-Mail/Passwort.
- Admin-User `diginutz.e@gmail.com` wird per Migration + Insert erstellt (via `auth.admin` server-fn), Rolle `admin` gesetzt.

**Admin-Bereiche** (alle unter `/_authenticated/_admin/admin/*`, Sidebar-Layout):
1. `/admin/products` — Tabelle mit Filter/Suche, Bulk-Toggle `is_active`.
2. `/admin/products/$id` — Editor: Texte DE/EN, `discount_percent`, `hero_image`/`hover_image` Upload zu Storage `product-images`, Galerie-CRUD auf `product_images` (Rolle, sort_order), Varianten-CRUD auf `product_variants`, Flags.
3. `/admin/homepage` — Auswahl Bestseller (max 4, setzt `is_bestseller`); „Neu im Atelier" analog über neues Feld `is_featured` (Migration nötig, weil aktuell nicht vorhanden).
4. `/admin/settings` — Kontaktdaten + Impressum. **Wichtige Entscheidung nötig** (siehe unten).
5. `/admin/orders` — Liste + Detail, Status-Dropdown (`pending|paid|shipped|done|cancelled`), Personalisierung aus `items` JSONB sichtbar.

**Technisch**
- Alle Schreiboperationen laufen über `createServerFn` mit `requireSupabaseAuth` + Admin-Check via `has_role`; erst danach dynamisch importierter `supabaseAdmin` für privilegierte Writes (Storage upload, product/variant Upserts bleiben unter RLS als Admin-User möglich, sobald wir Admin-Write-Policies via `has_role` hinzufügen).
- Neue RLS-Policies: `has_role(auth.uid(),'admin')` darf INSERT/UPDATE/DELETE auf `products`, `product_images`, `product_variants`, `orders`, `contact_messages`.
- Storage-Uploads für Bilder via signed upload aus Server-Fn.

### Punkte, die ich vor dem Bauen klären muss

1. **Einstellungen `/admin/settings` — Speicherort.**
   Aktuell sind Kontakte in `src/config/contact.ts` (statischer Code, wird beim Build eingebunden). Zwei Optionen:
   - **(a)** Neue Tabelle `site_settings` (key/value JSONB), Frontend liest sie via Loader aus DB → Änderungen ohne Redeploy sichtbar. Sauber, aber Footer/Header/Impressum müssen alle auf Loader-Daten umgestellt werden.
   - **(b)** Admin-UI schreibt in eine DB-Tabelle, ein Server-Fn generiert daraus `contact.ts` — nicht möglich (Runtime kann keine Repo-Files schreiben).
   → **Empfehlung: (a)**. Bitte bestätigen, sonst bleibt `contact.ts` schreibgeschützt und `/admin/settings` wird nur read-only Anzeige.

2. **„Neu im Atelier" Auswahl.**
   Es gibt aktuell kein `is_featured`-Feld. Ich lege es per Migration an (bool, default false, max 4 via UI-Guard). OK?

3. **Erst-Admin.**
   Ich lege `diginutz.e@gmail.com` per Server-Fn (auth.admin.createUser) mit Zufallspasswort + Rolle `admin` an. Du bekommst Anleitung: auf `/admin/login` → „Passwort vergessen" → Reset-Mail. Reset-Mails brauchen ein aktives E-Mail-Setup (Lovable Emails). Ist das schon eingerichtet? Wenn nein, kann ich `scaffold_auth_email_templates` mitlaufen lassen — bestätige einfach.

4. **Design.**
   Funktional, shadcn-Tabellen/Forms, Sidebar links. Keine Storefront-Styles. Bestätigt so?

Sobald ich zu (1)–(3) grünes Licht habe, baue ich alles in einem Rutsch, publiziere und liefere Timestamp + `curl`-Output von `/admin/login`.
