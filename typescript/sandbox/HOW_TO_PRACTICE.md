# Инструкция по упражнениям (TypeScript)

Практика — **`.ts`**. React и Next.js здесь нет.

Команды — **из корня** `js_course/` (там уже `typescript` в `devDependencies`). Один раз: `npm install`.

## Структура

```
typescript/sandbox/js_sandbox/
├── tsconfig.json
├── browser/                  ← CSS/JS раннера
└── topics/topic_N/
    ├── exercises.ts
    ├── solutions.ts
    └── browser/index.html    ← после tsc: импорт exercises.js
```

## Терминал

```bash
npx tsx typescript/sandbox/js_sandbox/topics/topic_1/exercises.ts
npx tsx typescript/sandbox/js_sandbox/topics/topic_1/solutions.ts
npx tsc -p typescript/sandbox/js_sandbox/tsconfig.json --noEmit
```

В `exercises.ts` есть автозапуск, если нет `document`.

## Браузер

1. `npm run bridge:watch` — `tsc` пишет `.js` рядом с `.ts`.
2. Live Server на `topics/topic_N/browser/index.html` (не `file://`).
3. Тема 11 (DOM): папка `topic_9`, на странице `#title`. Тема 10: `topic_10`. Тема 9: `topic_8`.
4. Тема 6: `topic_6_alias`. Тема 7: `topic_6`. Тема 8: `topic_7`. Темы 12–14: папки `topic_12`…`topic_14` (в 14 есть `lesson.ts`).

Скомпилированные `topics/**/*.js` в git не кладём.

## Порядок

Теория → `exercises.ts` → `tsx` или кнопка → `solutions.ts`.

Список тем: [`../general/02_topic_list.md`](../general/02_topic_list.md)
