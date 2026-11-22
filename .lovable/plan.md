# Новая категория «Geschenkbox» для коробочек

## Что уже есть
Коробочка с Etsy уже лежит в категории `geschenkbox`, но это настроено только для одного товара: цены и персонализация заданы вручную у него.

## Что сделаю
1. **Категория для всех таких боксов.** Каждый новый товар, созданный через «+ Neues Produkt» с категорией Geschenkbox, сразу получает два варианта:
   - Kraftpapier-Box Set — 22 € (с акцией −30% = 15,40 €), выбран по умолчанию
   - Nur Trockenblumen — 13 € (с акцией = 9,10 €)
   Цены у каждого товара потом можно поменять в его карточке.
2. **Персонализация для всей категории.** Поле «Vorname des Beschenkten» (обязательно, 2–30 букв) задаётся один раз для категории Geschenkbox в разделе Personalisierung, а «Namen» и «Wunschtext» для этой категории скрываются. Сейчас это настроено только у одной коробочки, перенесу на категорию.
3. **Фильтр в магазине.** На /shop в блоке Material появится шестая кнопка «Geschenkbox» со всеми товарами этой категории.
4. **Название в админке.** В списке категорий будет видно «Geschenkbox (Kraftpapier)», чтобы её было легко выбрать.

Существующая коробочка останется как есть (цены 22 € / 13 €), просто будет пользоваться общими настройками категории.

## Технические детали
- `adminCreateProduct` (admin.functions.ts): для `category === "geschenkbox"` вставлять две строки в `product_size_variants` (2200/1300 Cent, discount_percent 30).
- Personalisierung: блок с scope `category`/`geschenkbox` + Override-Blöcke `hidden` для names/message; Produkt-Blöcke der bestehenden Box entfernen (данные, без изменения схемы).
- shop.index.tsx: MATERIAL_VALUES + MATERIALS um `geschenkbox`; i18n `shop.matGeschenkbox` (DE/EN).
- Memory mem://features/shop-filters ergänzen.
