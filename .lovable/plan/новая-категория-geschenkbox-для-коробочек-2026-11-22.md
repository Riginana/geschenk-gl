# Новая категория «Geschenkbox» для коробочек

## Что уже есть
Коробочка с Etsy уже лежит в категории `geschenkbox`, но это настроено только для одного товара: цены и персонализация заданы вручную у него.

## Что сделаю
1. **Категория для всех таких боксов.** Каждый новый товар, созданный через «+ Neues Produkt» с категорией Geschenkbox, сразу получает два варианта:
   - Kraftpapier-Box Set — 20,00 € (скидка −28% = 14,40 €), выбран по умолчанию
   - Nur Trockenblumen — 13 € (с акцией = 9,10 €)
   Цены у каждого товара потом можно поменять в его карточке.
2. **Персонализация для всей категории.** Поле «Vorname des Beschenkten» (обязательно, 2–30 букв) задаётся один раз для категории Geschenkbox в разделе Personalisierung, а «Namen» и «Wunschtext» для этой категории скрываются. Сейчас это настроено только у одной коробочки, перенесу на категорию.
3. **Выбор «Variante 3,5 cm».** Для всей категории добавлю обязательный выпадающий список «Variante 3,5 cm» с вариантами: von Herzen, Stern, HoHoHo, Herz, kleiner Wunscherf/er, Frohe Weihnachten. Без доплаты (если нужна доплата — скажите). Выбранный вариант будет виден в заказе в админке. Список можно менять в разделе Personalisierung.
4. **Фильтр в магазине.** На /shop в блоке Material появится шестая кнопка «Geschenkbox» со всеми товарами этой категории.
5. **Название в админке.** В списке категорий будет видно «Geschenkbox (Kraftpapier)», чтобы её было легко выбрать.

Существующая коробочка останется как есть (её цена тоже станет 20,00 € / 14,40 €; Nur Trockenblumen остаётся 13 € / 9,10 €), просто будет пользоваться общими настройками категории.

## Технические детали
- `adminCreateProduct` (admin.functions.ts): для `category === "geschenkbox"` вставлять две строки в `product_size_variants` (2000 Cent/discount 28, 1300 Cent/discount 30); bestehende Box-Variante auf 2000/28 aktualisieren.
- Personalisierung: блок с scope `category`/`geschenkbox` + Override-Blöcke `hidden` для names/message; Produkt-Blöcke der bestehenden Box entfernen (данные, без изменения схемы).
- Block `select` (field_key `variante_35`, required, options = 6 Werte) im Scope category/geschenkbox.
- shop.index.tsx: MATERIAL_VALUES + MATERIALS um `geschenkbox`; i18n `shop.matGeschenkbox` (DE/EN).
- Memory mem://features/shop-filters ergänzen.
