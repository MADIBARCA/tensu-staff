# Tensu Staff 2

Telegram Web App для тренеров спортивных клубов.

## Технологии

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Telegram WebApp API

## Установка

```bash
npm install
```

## Разработка

```bash
npm run dev
```

## Сборка

```bash
npm run build
```

## Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── Layout.tsx      # Основной layout с навигацией
│   └── ui/             # UI компоненты
├── functions/
│   └── axios/          # API клиент
│       ├── endpoints.ts      # Эндпоинты API
│       ├── axiosFunctions.ts # Функции для работы с API
│       ├── requests.ts        # Типы запросов
│       └── responses.ts       # Типы ответов
├── hooks/              # React хуки
│   └── useTelegram.ts  # Хук для работы с Telegram WebApp
├── i18n/               # Интернационализация
│   └── i18n.tsx        # Провайдер и хук для переводов
├── pages/              # Страницы приложения
│   ├── onboarding/     # Страница онбординга
│   └── staff-pages/    # Страницы для тренеров
├── types/              # TypeScript типы
└── lib/                # Утилиты

```

## Следующие шаги

1. Добавить эндпоинты для тренеров в `src/functions/axios/endpoints.ts`
2. Реализовать страницы согласно бизнес-анализу
3. Добавить переводы в `src/i18n/i18n.tsx`

## Примечания

- API база URL: `https://api.tensu.kz/api/v1`
- Проект использует тот же стиль дизайна, что и `tensu-students-2`
- Все страницы должны быть адаптивными для мобильных устройств
