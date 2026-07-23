# Миграция каталога 142 товаров в Supabase — v2

## Проверка FK перед DELETE (выполнено сейчас)

Запрос `pg_constraint` по `confrelid='public.products'` вернул ровно одну ссылку:

- `reviews.product_id → products(id)` **ON DELETE SET NULL**

Других таблиц со ссылкой на `products(id)` нет. Таблица `orders` хранит позиции в JSONB (`items jsonb`) и **не имеет FK** на `products` — заказы покупателей DELETE'ом не затрагиваются. Значит `DELETE FROM public.products`:

- обнулит `reviews.product_id` у отзывов (не удалит сами отзывы),
- не тронет `orders`.

Дополнительно перед DELETE делаем снапшот отзывов (`review_id → old product_id`), чтобы после bulk-insert восстановить связи там, где slug/id совпал.

## Шаг 1. Схема (одна migration-транзакция)

Migration-tool сам оборачивает SQL в транзакцию. В этой migration:

1. Создать `public.products_backup_20260723` как полную копию `products` (`CREATE TABLE ... AS SELECT * FROM products`) — для ручного отката.
2. Создать `public.reviews_product_link_backup_20260723` (`review_id`, `product_id`) — снапшот текущих связей отзывов.
3. `ALTER TABLE public.products` — добавить `category`, `material_label`, `discount_percent` (default 30, CHECK 0..90), `hero_image`, `hover_image`, `is_bestseller`, `in_stock`, `sort_order`, `tags jsonb`, `updated_at`; удалить устаревшие `formats`, `images`.
4. `CREATE TABLE public.product_images` (`product_id` FK ON DELETE CASCADE, `url`, `role` в {hero,gallery,product,thumbnail}, `sort_order`, `alt`) + GRANT + RLS + policy «читать фото только опубликованных товаров».
5. `CREATE TABLE public.product_variants` (`product_id` FK ON DELETE CASCADE, `format` nullable в {A5,A4,A3}, `material` в {holz,papier,kraftpapier}, `price_cents`, `is_default`, `sort_order`) + два частичных UNIQUE-индекса (с и без `format`) + GRANT + RLS + policy «читать варианты только опубликованных товаров».
6. Триггер `updated_at` на `products`.

Backup-таблицы: `GRANT ALL ... TO service_role` (без anon/authenticated), RLS enabled без policies — публично недоступны.

## Шаг 2. Bulk-insert (одна insert-транзакция)

Отдельный вызов, всё внутри `BEGIN ... COMMIT`:

```sql
BEGIN;
  UPDATE public.reviews SET product_id = NULL WHERE product_id IS NOT NULL;
  DELETE FROM public.products;                       -- products_backup_* уже создан migration'ом
  INSERT INTO public.products (...) VALUES (...);    -- 142 строки
  INSERT INTO public.product_images (...) VALUES (...);
  INSERT INTO public.product_variants (...) VALUES (...);
  -- восстановить reviews.product_id по совпадению нового products.id со снапшотом
  UPDATE public.reviews r
    SET product_id = b.product_id
    FROM public.reviews_product_link_backup_20260723 b
    WHERE r.id = b.review_id
      AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = b.product_id);
COMMIT;
```

Если любая из INSERT-строк падает (CHECK, UNIQUE, тип) — вся транзакция откатывается, `products` остаётся пустой **только внутри отката**, снаружи она вернётся к исходному состоянию, backup-таблицы остаются нетронуты для ручного восстановления при необходимости.

Данные генерирую из `src/data/products.json` (142 продукта):

- **products**: `id`, `slug`, `name_de/en`, `description_de/en`, `occasion`, `material`, `material_label`, `category`, `base_price_cents`, `discount_percent=30`, `hero_image`, `hover_image`, `is_bestseller` (для 4 текущих bestseller-slug'ов из `index.tsx`), `in_stock`, `is_active=true`, `sort_order` по индексу в JSON, `tags`.
- **product_images**: по одному ряду с `role='hero'` (из `heroImage`) + N рядов `role='gallery'` (из массива `images` с sort_order).
- **product_variants**: комбинации `formats × material` с ценами по `calculateVariantPrice(base_price_cents, category, format, material)` — та же формула, что и в `src/lib/pricing.ts` сейчас (Bilderrahmen: A5=1300/A4=1600/A3=1900; Holzbox=2600; Holzschild=1500; Schiebebox=1900; +300 за `holz`). `is_default=true` для первой пары `(formats[0], material)`.

## Шаг 3. Отчёт

После insert выполняю и вставляю в ответ фактический вывод:

```sql
SELECT count(*) FROM public.products;
SELECT count(*) FROM public.product_images;
SELECT count(*) FROM public.product_variants;
SELECT slug, is_bestseller FROM public.products WHERE is_bestseller = true;
SELECT slug, count(*) AS images FROM public.products p
  JOIN public.product_images i ON i.product_id = p.id
  GROUP BY slug ORDER BY images LIMIT 5;
```

## Шаг 4. Единая формула цены

`src/lib/pricing.ts`:

```ts
export function calculateDiscountedPrice(priceCents: number, discountPercent: number): number {
  return Math.round(priceCents * (1 - discountPercent / 100));
}
```

Все места (карточки, PDP, cart, orders) переводятся на неё; старые константы удаляются.

## Шаг 5. Переключение источника данных

- `src/lib/products.functions.ts` — читать `products + product_images + product_variants` из Supabase (публикабельный ключ на сервере, RLS-safe), собирать в тот же DTO, что ждут страницы.
- `src/lib/orders.functions.ts` — валидировать цены по `product_variants` из БД + `calculateDiscountedPrice`.
- `src/routes/product.$id.tsx`, `shop.index.tsx`, `index.tsx` (Bestseller) — работать с новым DTO.
- `src/data/products.json` — удалить после того, как всё работает.

## Шаг 6. Верификация и Publish

- Локально: `tsgo` + Playwright — открыть `/shop`, `/product/<slug>`, проверить цену, галерею, `In den Warenkorb`.
- Publish. Жду завершения, затем curl'ом проверяю `https://geschenk-gl.lovable.app/product/…` — статус 200, наличие `<h1>`, цена, `og:image`. В отчёт: timestamp, ссылка, фрагмент HTML.

Если любой шаг падает — останавливаюсь и пишу, что произошло.

## Стратегия отката

- `products_backup_20260723` и `reviews_product_link_backup_20260723` живут в БД до явного удаления. Ручной откат: `TRUNCATE products CASCADE; INSERT INTO products SELECT * FROM products_backup_20260723; UPDATE reviews … FROM reviews_product_link_backup_20260723`.
