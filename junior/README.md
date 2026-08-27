# JavaScript для Junior

Курс чистого JavaScript: научиться **писать и читать код** в браузере и Node.js. Без TypeScript, React и Next.js.

**Стек:** JavaScript (`.js`) · браузер · Node.js  
**Статус:** теория (E) и практика (F) готовы. Дальше по слоям: [`../typescript/README.md`](../typescript/README.md).

Полная стратегия слоёв: [`../COURSE_ROADMAP.md`](../COURSE_ROADMAP.md).  
Дальше по уровню: [`../typescript/README.md`](../typescript/README.md) → [`../middle/README.md`](../middle/README.md) (Middle — только если уже пишешь React/TS).

---

## Для кого

- Кто только осваивает язык или чувствует пробелы в базе.
- Кто хочет уверенно пользоваться переменными, функциями, DOM и `async/await`, не прыгая сразу в Event Loop и интервью-головоломки.

---

## Чем курс отличается от Middle

- Своя нумерация тем, не 1–45 middle.
- Нет блока «связь со стеком React/Next/TS».
- Практика только в `.js`.
- Event Loop — упрощённая тема в конце раздела про асинхронность, не тема 1.

Стандарт темы: [`general/01_topic_requirements.md`](general/01_topic_requirements.md)  
Список тем и зависимости: [`general/02_topic_list.md`](general/02_topic_list.md)  
Практика: [`sandbox/HOW_TO_PRACTICE.md`](sandbox/HOW_TO_PRACTICE.md) · [оглавление раннеров](sandbox/js_sandbox/README.md)

---

## Структура

```
junior/
├── README.md
├── general/
│   ├── 01_topic_requirements.md
│   └── 02_topic_list.md
├── topics/                    ← теория разделов 1–9
└── sandbox/
    ├── HOW_TO_PRACTICE.md
    ├── GUIDE.md
    └── js_sandbox/            ← упражнения .js + браузерный раннер
```

---

## Как проходить

1. Иди по [`topics/README.md`](topics/README.md): разделы 1–9. DOM — браузер; `fetch` — браузер или Node 18+; модули — `type="module"` или Node ESM.
2. Практика: [`sandbox/HOW_TO_PRACTICE.md`](sandbox/HOW_TO_PRACTICE.md). Live Server на `sandbox/js_sandbox/topics/topic_N/browser/index.html` или `node exercises.js` из папки темы.
3. Сверяйся с `solutions.js` после своей попытки.
