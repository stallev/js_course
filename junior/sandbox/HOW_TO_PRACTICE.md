# Инструкция по упражнениям (Junior)

Практика — **только `.js`**. TypeScript и Next.js здесь нет.

## Структура

```
junior/sandbox/js_sandbox/
├── package.json              ← "type": "module"
├── browser/                  ← общий CSS/JS раннера
└── topics/topic_N/
    ├── exercises.js          ← твой файл (TODO)
    ├── solutions.js          ← смотри после попытки
    └── browser/index.html    ← Live Server
```

Тема 25 дополнительно: `math.js` (экспорт `double`).

## Браузер

1. Открой `topics/topic_N/browser/index.html` через Live Server (нужен http, не `file://` — иначе модули могут не загрузиться).
2. Реализуй функции в `exercises.js`, сохрани.
3. Нажми «Запустить». Вывод — на странице и в DevTools (F12).

Темы 17–19 и 23 завязаны на DOM / сеть: только браузер (23 ещё и интернет).

## Терминал

Из папки темы:

```bash
cd junior/sandbox/js_sandbox/topics/topic_1
node exercises.js
```

Или из корня репозитория:

```bash
node junior/sandbox/js_sandbox/topics/topic_1/exercises.js
```

В `exercises.js` есть автозапуск, если нет `document` (то есть в Node).

## Порядок

Теория темы → `exercises.js` → кнопка или `node` → `solutions.js`.

Список тем: [`../general/02_topic_list.md`](../general/02_topic_list.md)  
Теория: [`../topics/README.md`](../topics/README.md)
