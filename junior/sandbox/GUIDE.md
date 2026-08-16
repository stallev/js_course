# Руководство по заданиям Junior (для авторов)

- Только `.js`. Не добавлять `tsconfig.json`.
- Нет `next_sandbox`.
- Источник — практические блоки в `junior/topics/` и [`../general/01_topic_requirements.md`](../general/01_topic_requirements.md).

## Каркас темы

```
topics/topic_N/
├── exercises.js
├── solutions.js
└── browser/index.html
```

Общий раннер: `js_sandbox/browser/runner.css` + `runner.js`. Страницы собирает `node browser/gen-pages.mjs`. Заготовки JS — `node browser/gen-exercises.mjs` (перезапишет TODO: не гоняй вслепую, если правил вручную).

`N` — номер из [`../general/02_topic_list.md`](../general/02_topic_list.md).

В `js_sandbox/package.json` стоит `"type": "module"`.
