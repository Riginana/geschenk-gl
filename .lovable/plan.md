# Кнопка «Заказ получен» в карточке заказа

## Что будет
1. В карточке заказа в админке появится кнопка **«Bestellung erhalten»** (Заказ получен).
2. При нажатии статус заказа меняется на новый статус **«Erhalten»** (Получен), сохраняется дата получения.
3. Клиенту автоматически уходит письмо-подтверждение: «Deine Bestellung ist angekommen» — с именем, списком товаров, адресом и благодарностью (просьба оставить отзыв, контакт при вопросах).
4. Если заказ уже получен, кнопка скрыта; вместо неё «Erhalten am …» и кнопка «E-Mail erneut senden».
5. Статус «Erhalten» также доступен в выпадающем списке статусов и в фильтре.

Письмо уходит один раз (повторное нажатие не дублирует), через уже настроенную почту notify.diginutz.de.

## Технические детали
- Миграция: `ALTER TYPE order_status ADD VALUE 'received'`; `orders.received_at timestamptz`, `orders.received_email_sent_at timestamptz` (nullable).
- Шаблон `src/lib/email-templates/order-received.tsx` в стиле `order-shipped`, регистрация в `registry.ts`.
- `admin-config.functions.ts`: добавить `received` в `ORDER_STATUSES`, поля в `ORDER_COLS`/`AdminOrderRow`; новая серверная функция `adminMarkOrderReceived` (admin-проверка, статус + `received_at`, отправка `order-received` с ключом `order-received-<id>`, запись `received_email_sent_at`); `adminUpdateOrder` при первом переходе в `received` делает то же; `adminResendReceivedEmail`.
- `src/routes/admin/orders.tsx`: опция «Erhalten», кнопка, отображение даты, кнопка повторной отправки.
