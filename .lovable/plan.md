# План: RAHMEN-VARIANTE в заказах админ-панели

## Что уже выяснено
- Заказ Thomas Karmann (karmann.thomas2604@gmail.com, 28.09.2026) содержит выбранную раму: `frameVariant: echtholz_weiss` → **Echtholz Weiß**, размер A5.
- Код отображения «RAHMEN-VARIANTE» в карточке заказа (`src/routes/admin/orders.tsx`) уже существует и показывает вариант рамы + размер для каждой позиции заказа.

## Что делаем
1. Проверить в браузере (войдя как админ), что в карточке заказа Thomas Karmann отображается строка «RAHMEN-VARIANTE: Echtholz Weiß · Größe A5».
2. Если отображение работает — опубликовать приложение, чтобы изменение появилось на живом сайте.
3. Если строка не видна — исправить рендеринг позиций заказа в `src/routes/admin/orders.tsx` и повторно проверить.

## Технические детали
- Данные берутся из `orders.items[].personalization.frameVariant` / `frameSize` / `material`.
- Названия вариантов — из `FRAME_VARIANT_LABELS` в `src/lib/frame-pricing.ts` (echtholz_weiss = «Echtholz Weiß»).
- Изменений в базе данных не требуется.
