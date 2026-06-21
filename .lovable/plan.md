# DigiNutz-style Geldgeschenke Shop — Implementation Plan

A premium, animated, mobile-first e-commerce site for handmade personalized money-gift frames (Geldgeschenke), in German with EN toggle, EUR pricing, full catalog + personalization + cart + mock checkout, reviews, and Lovable Cloud backend.

## 1. Design system

**Mood:** warm "Handmade Atelier" — natural materials (wood, kraft paper, linen), generous whitespace, premium boutique feel.

- **Palette (oklch tokens in `src/styles.css`):**
  - background: warm cream `oklch(0.98 0.012 85)`
  - foreground: deep walnut `oklch(0.22 0.025 60)`
  - primary: dark wood `oklch(0.32 0.035 55)`
  - accent: brushed brass/gold `oklch(0.72 0.12 80)`
  - muted: linen `oklch(0.94 0.015 80)`
  - card: ivory `oklch(0.99 0.008 85)`
- **Typography (via `<link>` in `__root.tsx` head):**
  - Headings: Cormorant Garamond (serif, elegant)
  - Body: Inter (clean sans)
  - Accents/eyebrows: small-caps tracking
- **Texture details:** subtle paper-grain SVG background on hero sections, soft drop-shadows, generous radii (rounded-2xl for cards), thin gold dividers.
- **Motion:** Framer Motion for page/section transitions (fade+slide 250–350ms), scroll-reveal via `whileInView`, card hover (lift + shadow + second-image fade), button tap scale, animated counter on home stats, parallax hero, toast slide-in. Skeleton loaders for product cards.

## 2. Stack & backend

- TanStack Start (existing template), Tailwind v4, shadcn/ui, Framer Motion, Embla Carousel.
- **Lovable Cloud enabled** with these tables (all with RLS + proper GRANTs):
  - `products` — id, slug, name_de, name_en, description_de, description_en, base_price_cents, occasion, material, formats (jsonb), images (jsonb), badge ('bestseller'|'neu'|null), is_active. **Public anon SELECT.**
  - `reviews` — id, product_id (nullable for general), customer_name, rating (1–5), text_de, text_en, photo_url, occasion, created_at. **Public anon SELECT** for is_published rows.
  - `orders` — id, email, address (jsonb), items (jsonb), total_cents, status, created_at. Insert allowed for anon (mock checkout); SELECT only via service_role.
  - `newsletter_subscribers` — id, email, locale, created_at. Anon INSERT only.
  - `contact_messages` — id, name, email, phone, message, created_at. Anon INSERT only.
- Server functions in `src/lib/*.functions.ts`:
  - `listProducts`, `getProductBySlug`, `listReviews` (public, server publishable client)
  - `submitOrder`, `subscribeNewsletter`, `submitContact` (anon insert with zod validation + rate-limit-friendly shape)
- Seed data via migration: ~16 products across occasions, ~25 reviews.

## 3. i18n

- Lightweight context-based translator: `src/i18n/{de.ts,en.ts}` dictionaries + `useT()` hook + `<LanguageProvider>` in `__root.tsx`. Default `de`, persisted in `localStorage`. Flag/DE-EN toggle in header.
- Product copy stored bilingually in DB columns (`name_de`/`name_en`, etc.) — selector picks by current locale.
- EUR formatter using `Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR' })`.

## 4. Routes (TanStack file-based, all with proper `head()` meta in German)

```
src/routes/
  __root.tsx                 (Header, Footer, LanguageProvider, CartProvider, Toaster)
  index.tsx                  Startseite
  shop.tsx                   Katalog (filters + grid)
  shop.$slug.tsx             Produktseite (configurator)
  warenkorb.tsx              Cart
  kasse.tsx                  Checkout (mock)
  bestellung-bestaetigt.tsx  Success
  bewertungen.tsx            All reviews
  ueber-uns.tsx              About
  kontakt.tsx                Contact (form + Maps iframe + socials)
  wunschliste.tsx            Wishlist
  impressum.tsx              Legal stub
  agb.tsx                    Legal stub
  datenschutz.tsx            Legal stub
  widerruf.tsx               Legal stub
  versand.tsx                Shipping info stub
  faq.tsx                    FAQ stub
```

## 5. Components

- `Header` — logo, nav (Shop, Bewertungen, Über uns, Kontakt), search, wishlist, cart (with animated badge), language toggle. Sticky with blur on scroll. Mobile burger sheet.
- `Footer` — newsletter form, social icons, legal links, payment badges, "Handmade in Germany".
- `Hero` — parallax framed-photo + cash visual, animated headline, CTA.
- `HowItWorks` — 3-step illustrated row.
- `OccasionGrid` — 9 occasion tiles with hover zoom.
- `ProductCard` — image hover-swap, badge, price, wishlist heart, quick-add.
- `ProductCardSkeleton`.
- `ProductGallery` — main + thumbnails, zoom on hover.
- `Personalizer` — name, date (de-DE), message, format (A5/A4/A3), material (Karton/Holz), variant. Live preview overlay (text rendered on product image with chosen font). Dynamic price calc.
- `ReviewsCarousel` (Embla, autoplay), `ReviewCard`, `StarRating`, `AnimatedCounter`.
- `CartDrawer` / cart page; flying-to-cart animation on add.
- `CheckoutForm` — address (PLZ regex `/^\d{5}$/`), shipping method, payment-method picker (PayPal/Stripe/Kreditkarte/Apple Pay/Google Pay as visual buttons — clicking any submits the mock order).
- `OrderSuccess` — confetti/check animation.
- `Toast` system (sonner).

## 6. State

- `CartContext` (localStorage-persisted): items with personalization snapshot, qty, line price.
- `WishlistContext` (localStorage).
- `LanguageContext`.
- TanStack Query for products/reviews fetching from server fns.

## 7. Mock checkout flow

All payment buttons trigger the same `submitOrder` server fn (stores order with `status: 'pending_mock'`), then redirect to `/bestellung-bestaetigt?id=...`. Each button visually shows the brand (PayPal yellow, Apple Pay black, etc.) but no real gateway call. Clear `// TODO: real payment integration` comments in code.

## 8. SEO

- Per-route German `title` + `description` + `og:title` + `og:description`; relative canonical/og:url.
- Single H1 per page; semantic sections; `alt` on every image; JSON-LD `Product` on product pages, `Organization` on root.
- `robots.txt` allowing all; `sitemap.xml` placeholder.

## 9. Build order (single iteration)

1. Enable Lovable Cloud → migration (tables + RLS + GRANTs + seed).
2. Tokens, fonts, layout primitives, Header/Footer, i18n, providers in `__root.tsx`.
3. Server functions + types.
4. Home page (hero, how-it-works, occasions, bestsellers, reviews carousel, about teaser, newsletter).
5. Shop list + filters; product detail with personalizer.
6. Cart + checkout + success.
7. Reviews, About, Contact (with Google Maps iframe placeholder + socials).
8. Legal stub pages, Wishlist, FAQ.
9. Generate hero + occasion + product placeholder imagery with `imagegen` (warm handmade frames + euro notes on linen).
10. SEO meta + JSON-LD + sitemap/robots.

## 10. Out of scope (TODO for later)

- Real payment gateways (PayPal, Stripe, Apple Pay, Google Pay).
- Real Google Maps API key (iframe embed placeholder used).
- Admin dashboard for products/orders.
- Email sending (newsletter confirmations, order receipts).
- Real legal copy (stubs only).
