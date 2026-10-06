# Why new frame products get different prices

## Cause
Every frame product belongs to one of three subcategories (Papier, Holz, HDF), and each subcategory has its own price table. Most of your existing frames (87) are **Papier**. New products are automatically filed under **Holz**, because the "+ Neues Produkt" form doesn't ask for a subcategory.

The Holz prices are higher, e.g. (before discount):

| | Papier | Holz |
|---|---|---|
| A5 ohne Rahmen | 13 € | 17 € |
| A5 Standard Weiß | 20 € | 23 € |
| A4 ohne Rahmen | 17 € | 23 € |
| A3 Standard Weiß | 38 € | 50 € |

Your new product "Personalisiertes Weihnachts Geldgeschenk im Bilderrahmen" is also filed under Holz, so it shows Holz prices.

## Fix
1. **Ask for the subcategory when creating a product.** For frame products, the "+ Neues Produkt" form gets a "Unterkategorie" field (Papier / Holz / HDF), preset to **Papier**, which matches most of the shop.
2. **New products default to Papier.** If no subcategory is chosen, new frames fall under Papier instead of Holz.
3. **Clearer label on the edit page.** The existing subcategory field on the product page gets a short note: "Bestimmt, welche Preistabelle unter Rahmenpreise gilt".
4. **Correct the new Christmas product.** Move it to Papier so it has the same prices as the other Papier frames, unless you tell me it really is a wooden frame.

Existing products are not changed (except the Christmas one in step 4), and the price tables stay as they are.

## Technical details
- `src/routes/admin/products/index.tsx` create modal: add a `frame_material` select shown when category = bilderrahmen; pass it to the create server fn (schema already accepts `frame_material`, `admin.functions.ts:93`).
- Create handler: default `frame_material` to `"papier"` when not provided (code-level default; no change to the column default).
- `src/routes/admin/products/$id.tsx:272`: help text under the select; display fallback `"papier"`.
- Data fix: update `frame_material = 'papier'` for product `2eb979be-a721-4526-8989-472f77c15e4e` through the existing admin function.
