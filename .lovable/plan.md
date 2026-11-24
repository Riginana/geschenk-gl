# Скрыть «Format» и «Material» у коробочек Geschenkbox

На странице товаров категории Geschenkbox больше не будут показываться выбор формата и выбор материала. Варианты (Kraftpapier-Box Set / Nur Trockenblumen), цены и поле для имени остаются как есть.

## Technical details
- `src/routes/product.$id.tsx`: добавить `const isGeschenkbox = product?.category === "geschenkbox"` и в условие блока Format/Material (строка ~526) дописать `&& !isGeschenkbox`.
- Цены и корзина не меняются; проверка в браузере на странице коробочки.
