## Что добавить

Новая секция-витрина «Featured» сразу под Hero на главной (`src/routes/index.tsx`) — три загруженные фотографии (свадебный диск Karin & Markus, рамка «Abenteuer», деревянный геймпад) красиво показаны при входе на сайт.

## Композиция

Асимметричный триптих в стиле существующей эстетики (walnut/brass/cream, скруглённые углы, мягкие тени):

```text
┌──────────────────┬─────────────┐
│                  │   image 2   │
│     image 1      ├─────────────┤
│   (большая)      │   image 3   │
└──────────────────┴─────────────┘
```

- Левая большая карточка — свадебный диск (вертикаль 4:5).
- Правый столбец — две карточки поменьше (рамка сверху, геймпад снизу).
- На мобильном — стек в один столбец.
- Eyebrow «Neu im Atelier» + заголовок «Handgefertigte Lieblingsstücke», без описаний на самих карточках — фото говорят сами.
- Лёгкая анимация появления через существующий `<Reveal>` + hover-scale как у `ProductCard`.

## Технические детали

- Загрузить три файла как CDN-ассеты через `lovable-assets create` из `/mnt/user-uploads/...` → пойнтеры в `src/assets/featured-{wedding,adventure,controller}.jpg.asset.json`. Бинарники в репо не кладём.
- Новый компонент `FeaturedTrio` в `src/routes/index.tsx`, вставлен между `<Hero />` и `<HowItWorks />`.
- Стили: Tailwind grid `md:grid-cols-3 md:grid-rows-2` с `md:col-span-2 md:row-span-2` на главной карточке; `aspect-[4/5]` слева и `aspect-[4/3]` справа; `rounded-2xl`, `ring-1 ring-border/60`, `shadow-[0_24px_50px_-30px_rgba(60,40,20,0.25)]`.
- Тексты заголовка/eyebrow добавить ключами в `src/i18n/de.ts` и `src/i18n/en.ts` (`featured.eyebrow`, `featured.title`).
- Никакой бизнес-логики, роутов и данных не трогаем.

## Файлы, которые поменяются

- `src/assets/featured-wedding.jpg.asset.json` (новый)
- `src/assets/featured-adventure.jpg.asset.json` (новый)
- `src/assets/featured-controller.jpg.asset.json` (новый)
- `src/routes/index.tsx` — новая секция + импорты
- `src/i18n/de.ts`, `src/i18n/en.ts` — два ключа