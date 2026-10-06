# Fix: new products show without their own photos

## What is happening
The product "Personalisiertes Weihnachts Geldgeschenk im Bilderrahmen" is saved correctly: it is active, category Bilderrahmen, occasion Weihnachten, with 9 uploaded photos. It does appear in the shop, but with a **stand-in Christmas photo from another product** instead of its own photos. That makes it look like the upload didn't work.

Cause: the shop loads all product photos in one request, and the database returns at most 1000 photo rows per request. The catalog now has 1068 photos, so the newest ones (your new product's) get cut off. Every product you add from now on would hit the same problem, and older products can lose photos too as the catalog grows.

## Fix
1. **Load all photos and variants, however many there are.** The shop will fetch photos and variants in batches of 1000 until it has everything, so there is no upper limit any more. This affects the shop, category pages, home page and search.
2. **Pick a main photo automatically.** When a product has no main photo set (like the new one), the first uploaded "main" photo is used. If there is none, the first photo of any type is used. The stand-in photo only appears when a product has no photos at all.
3. **Hint in the admin.** On the product edit page, a small notice appears when no main photo is set. It explains that the first uploaded photo will be shown and offers a one-click "Als Hauptbild setzen" (set as main photo) on each image.

## Check afterwards
- The new Christmas frame shows its own photos in the shop, on the Weihnachten category and on its product page.
- Photo count per product matches the admin for a few older products.

## Technical details
- `src/lib/products.functions.ts` `listProducts`: replace the single `product_images` / `product_variants` selects with a paged helper (`.range(from, from+999)` loop until a short page), or filter `.in("product_id", activeIds)` in chunks. Keep the existing error handling.
- `assemble()`: images already fall back to `product_images` order when `hero_image` is null; with the full data, no change in role ordering is needed beyond making sure the "hero" role sorts first.
- `src/routes/admin/products/$id.tsx`: notice when `hero_image` is empty, plus a button per image that saves its URL to `hero_image` via the existing `saveField`.
- No database schema change.
